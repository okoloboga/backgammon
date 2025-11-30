import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './GameRoom.css';
import BoardPoint from './components/BoardPoint';
import Dice from './components/Dice';
import PlayerProfile from './components/PlayerProfile';
import { colyseusService } from '../../services/colyseusService';
import greenLayer from '../../assets/game/greenLayer.png';
import purpleLayer from '../../assets/game/purpleLayer.png';

const GameRoom = ({ roomId, onQuit, currentUser }) => {
  const [room, setRoom] = useState(null);
  // Authoritative state from the server
  const [gameState, setGameState] = useState({
    board: new Map(), bar: new Map(), off: new Map(), currentPlayer: '',
    dice: [], winner: '', possibleMoves: [], players: new Map(), playerProfiles: new Map(),
  });
  // Local state for optimistic updates during a turn
  const [previewState, setPreviewState] = useState(null);

  const [playerColor, setPlayerColor] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null); // 'bar' or point number
  const [highlightedPoints, setHighlightedPoints] = useState([]);

  // State for the move sequence being built
  const [currentMoves, setCurrentMoves] = useState([]);
  const [remainingDice, setRemainingDice] = useState([]);

  const isMyTurn = playerColor && gameState.currentPlayer === playerColor;
  const isInitialMount = useRef(true);

  // Sync preview state whenever the authoritative state changes
  useEffect(() => {
    setPreviewState(gameState);
    // When it becomes our turn, reset move state
    if (playerColor && gameState.currentPlayer === playerColor) {
      setCurrentMoves([]);
      setRemainingDice(gameState.dice);
      setSelectedPoint(null);
      setHighlightedPoints([]);
    }
  }, [gameState, playerColor]);

  useEffect(() => {
    const roomInstance = colyseusService.getGameRoom();
    if (roomInstance && roomInstance.roomId === roomId) {
      setRoom(roomInstance);

      roomInstance.onStateChange((newState) => {
        const transformedState = {
          board: newState.board ? new Map(Array.from(newState.board.entries())) : new Map(),
          bar: newState.bar ? new Map(Array.from(newState.bar.entries())) : new Map(),
          off: newState.off ? new Map(Array.from(newState.off.entries())) : new Map(),
          currentPlayer: newState.currentPlayer || '',
          dice: newState.dice ? Array.from(newState.dice) : [],
          winner: newState.winner || '',
          possibleMoves: newState.possibleMoves ? Array.from(newState.possibleMoves) : [],
          players: newState.players ? new Map(Array.from(newState.players.entries())) : new Map(),
          playerProfiles: newState.playerProfiles ? new Map(Array.from(newState.playerProfiles.entries())) : new Map(),
        };
        setGameState(transformedState);

        // Safely set player color here, where state is guaranteed to exist
        if (newState.players && roomInstance.sessionId) {
          const myColor = newState.players.get(roomInstance.sessionId);
          if (myColor) {
            setPlayerColor(myColor);
          }
        }
      });

      roomInstance.onMessage("error", (message) => console.error("Server error:", message));

      roomInstance.onMessage("opponent_left", (message) => {
        setModalMessage(message.message || 'Opponent left.');
        setShowOpponentLeftModal(true);
      });

    } else {
      onQuit();
    }

    return () => {
      // Guard against React 18 Strict Mode double-invocation
      if (isInitialMount.current) {
        isInitialMount.current = false;
      } else {
        colyseusService.leaveGameRoom();
      }
    };
  }, [roomId, onQuit]);

  const getPossibleDestinations = (fromPoint) => {
    const destinations = new Set();
    const direction = playerColor === 'white' ? -1 : 1;

    // Правило головы
    const headPoint = playerColor === 'white' ? 24 : 1;
    const isHead = fromPoint === headPoint;

    // Проверяем, снимали ли уже с головы в ТЕКУЩИХ (неподтвержденных) ходах
    const movesFromHeadCount = currentMoves.filter(m => m.from === headPoint).length;

    // Исключение для первого хода (turnCount <= 2) и дублей 3,4,6
    const isFirstTurn = (gameState.turnCount || 1) <= 2;
    let maxHeadMoves = 1;

    // Пытаемся определить, был ли это специальный дубль
    const totalDiceCount = remainingDice.length + currentMoves.length;
    if (isFirstTurn && totalDiceCount === 4) {
      const dieValue = remainingDice.length > 0 ? remainingDice[0] : (currentMoves[0] ? currentMoves[0].die : 0);
      if ([3, 4, 6].includes(dieValue)) {
        maxHeadMoves = 2;
      }
    }

    if (isHead && movesFromHeadCount >= maxHeadMoves) {
      return []; // Нельзя больше снимать с головы
    }

    remainingDice.forEach(die => {
      const toPoint = fromPoint === 'bar'
        ? (playerColor === 'white' ? 25 - die : die)
        : fromPoint + (die * direction);

      const targetPoint = previewState.board.get(toPoint.toString());

      // В длинных нардах НЕЛЬЗЯ ходить на поле противника вообще
      if (targetPoint && targetPoint.player && targetPoint.player !== playerColor) {
        return; // Пункт занят соперником
      }

      destinations.add(toPoint);
    });
    return Array.from(destinations);
  };

  const handlePointClick = (pointId) => {
    if (!isMyTurn || !previewState) return;

    // 1. Handle clicking a highlighted destination
    if (selectedPoint !== null && highlightedPoints.includes(pointId)) {
      const from = selectedPoint;
      const to = pointId;
      const direction = playerColor === 'white' ? -1 : 1;
      const distance = from === 'bar'
        ? (playerColor === 'white' ? 25 - to : to)
        : Math.abs(to - from);

      const dieIndex = remainingDice.indexOf(distance);
      if (dieIndex === -1) return; // Should not happen if highlighted
      const dieUsed = remainingDice[dieIndex];

      // Create a deep copy for mutation
      const newPreviewState = {
        ...previewState,
        board: new Map(previewState.board),
      };

      // Decrement 'from' point
      if (from !== 'bar') {
        const fromPoint = { ...newPreviewState.board.get(from.toString()) };
        fromPoint.checkers -= 1;
        if (fromPoint.checkers === 0) {
          newPreviewState.board.delete(from.toString());
        } else {
          newPreviewState.board.set(from.toString(), fromPoint);
        }
      }

      // Increment 'to' point
      const toPoint = { ...(newPreviewState.board.get(to.toString()) || { player: playerColor, checkers: 0 }) };
      toPoint.checkers += 1;
      toPoint.player = playerColor;
      newPreviewState.board.set(to.toString(), toPoint);

      setPreviewState(newPreviewState);

      // Update move sequence state
      setCurrentMoves(prev => [...prev, { from, to, die: dieUsed }]);
      const newRemainingDice = [...remainingDice];
      newRemainingDice.splice(dieIndex, 1);
      setRemainingDice(newRemainingDice);

      // Reset selection
      setSelectedPoint(null);
      setHighlightedPoints([]);
      return;
    }

    // 2. Handle selecting a checker
    const pointData = previewState.board.get(pointId.toString());
    if (pointData && pointData.player === playerColor) {
      const destinations = getPossibleDestinations(pointId);
      setSelectedPoint(pointId);
      setHighlightedPoints(destinations);
    } else {
      // Deselect if clicking elsewhere
      setSelectedPoint(null);
      setHighlightedPoints([]);
    }
  };

  const handleConfirmMoves = () => {
    const moveString = currentMoves.map(m => `${m.from}-${m.to}`).join(',');
    // Check if the constructed move is one of the valid sequences
    if (gameState.possibleMoves.includes(moveString)) {
      room.send('move', moveString);
    } else {
      console.error("Client move sequence not found in server's possible moves.", moveString);
      handleUndoMoves();
    }
  };

  const handleUndoMoves = () => {
    setPreviewState(gameState);
    setCurrentMoves([]);
    setRemainingDice(gameState.dice);
    setSelectedPoint(null);
    setHighlightedPoints([]);
  };

  const pointRenderOrder = {
    left: [13, 14, 15, 16, 17, 18, 12, 11, 10, 9, 8, 7],
    right: [19, 20, 21, 22, 23, 24, 6, 5, 4, 3, 2, 1],
  };

  const handleRollDice = () => room && canRoll && room.send('rollDice');
  const handleQuit = () => colyseusService.leaveGameRoom().then(onQuit);

  const canRoll = isMyTurn && gameState.dice.length === 0;
  // Enable confirm button when no dice are left to be played
  const canConfirm = currentMoves.length > 0 && remainingDice.length === 0;

  const renderableState = previewState || gameState;

  const playersMap = new Map(renderableState.players);
  const profilesMap = new Map(renderableState.playerProfiles);

  let whiteSessionId, blackSessionId;
  playersMap.forEach((color, sessionId) => {
    if (color === 'white') whiteSessionId = sessionId;
    if (color === 'black') blackSessionId = sessionId;
  });

  const getProfileForSession = (sessionId) => {
    if (!sessionId) return { username: '...waiting...', avatar: '/assets/icon.png' };
    const profile = profilesMap.get(sessionId) || {};
    const defaultProfile = { username: 'Player', avatar: '/assets/icon.png' };
    return { ...defaultProfile, ...profile };
  };

  const whitePlayer = getProfileForSession(whiteSessionId);
  const blackPlayer = getProfileForSession(blackSessionId);

  // Modal state that was missing from the previous refactor
  const [showOpponentLeftModal, setShowOpponentLeftModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  return (
    <div className="game-room">
      <button onClick={handleQuit} className="quit-button">Quit</button>
      <div className="game-area-wrapper">
        <div className="profiles-container">
          <PlayerProfile player={blackPlayer} align="left" />
          <PlayerProfile player={whitePlayer} align="right" />
        </div>
        <div className="game-board">
          <div className="board-half">
            <img src={greenLayer} alt="Board layer" className="board-bg" />
            <img src={purpleLayer} alt="Board overlay" className="board-bg overlay" />
            <div className="point-grid-container">
              {pointRenderOrder.left.map((id) => (
                <BoardPoint
                  key={id}
                  pointId={id}
                  isTop={id >= 13}
                  checkers={renderableState.board.get(id.toString())}
                  onClick={handlePointClick}
                  isSelected={selectedPoint === id}
                  isHighlighted={highlightedPoints.includes(id)}
                />
              ))}
            </div>
          </div>
          <div className="board-half">
            <img src={greenLayer} alt="Board layer" className="board-bg" />
            <img src={purpleLayer} alt="Board overlay" className="board-bg overlay" />
            <div className="point-grid-container">
              {pointRenderOrder.right.map((id) => (
                <BoardPoint
                  key={id}
                  pointId={id}
                  isTop={id >= 19}
                  checkers={renderableState.board.get(id.toString())}
                  onClick={handlePointClick}
                  isSelected={selectedPoint === id}
                  isHighlighted={highlightedPoints.includes(id)}
                />
              ))}
            </div>
            <div className="dice-area">
              {isMyTurn && currentMoves.length > 0 && (
                <div className="move-controls">
                  <button onClick={handleConfirmMoves} disabled={!canConfirm}>Confirm</button>
                  <button onClick={handleUndoMoves}>Undo</button>
                </div>
              )}
              {gameState.dice.length > 0 ? (
                remainingDice.map((value, i) => <Dice key={i} value={value} />)
              ) : (
                <button onClick={handleRollDice} disabled={!canRoll}>
                  {isMyTurn ? 'Roll Dice' : `Waiting for opponent`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showOpponentLeftModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Game Over</h2>
            <p>{modalMessage}</p>
            <p>Returning to lobby...</p>
          </div>
        </div>
      )}
    </div>
  );
};

GameRoom.propTypes = {
  roomId: PropTypes.string.isRequired,
  onQuit: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    username: PropTypes.string,
    avatar: PropTypes.string,
  }),
};

GameRoom.defaultProps = {
  currentUser: null,
};

export default GameRoom;