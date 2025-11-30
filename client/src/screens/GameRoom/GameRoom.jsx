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
  const [playerColor, setPlayerColor] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null); // 'bar' or point number
  const [highlightedPoints, setHighlightedPoints] = useState([]);

  const isMyTurn = playerColor && gameState.currentPlayer === playerColor;
  const isInitialMount = useRef(true);

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
          turnCount: newState.turnCount,
          turnMovesFromHead: newState.turnMovesFromHead,
        };
        setGameState(transformedState);

        // Reset selection on state update
        setSelectedPoint(null);
        setHighlightedPoints([]);
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

    // Используем счетчик из gameState
    const movesFromHeadCount = gameState.turnMovesFromHead || 0;

    // Исключение для первого хода (turnCount <= 2) и дублей 3,4,6
    const isFirstTurn = (gameState.turnCount || 1) <= 2;
    let maxHeadMoves = 1;

    if (isFirstTurn) {
      // Проверяем, есть ли подходящие кости (упрощенная проверка, сервер проверит точно)
      const hasSpecialDie = gameState.dice.some(d => [3, 4, 6].includes(d));
      if (hasSpecialDie) {
        maxHeadMoves = 2;
      }
    }

    if (isHead && movesFromHeadCount >= maxHeadMoves) {
      return []; // Нельзя больше снимать с головы
    }

    gameState.dice.forEach(die => {
      const toPoint = fromPoint === 'bar'
        ? (playerColor === 'white' ? 25 - die : die)
        : fromPoint + (die * direction);

      const targetPoint = gameState.board.get(toPoint.toString());

      // В длинных нардах НЕЛЬЗЯ ходить на поле противника вообще
      if (targetPoint && targetPoint.player && targetPoint.player !== playerColor) {
        return; // Пункт занят соперником
      }

      destinations.add(toPoint);
    });
    return Array.from(destinations);
  };

  const handlePointClick = (pointId) => {
    if (!isMyTurn) return;

    // 1. Handle moving a checker to a destination
    if (selectedPoint !== null && highlightedPoints.includes(pointId)) {
      const from = selectedPoint;
      const to = pointId;

      // Send move immediately
      room.send('move', { from, to });

      // Reset selection
      setSelectedPoint(null);
      setHighlightedPoints([]);
      return;
    }

    // 2. Handle selecting a checker
    const pointData = gameState.board.get(pointId.toString());
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

  const pointRenderOrder = {
    left: [13, 14, 15, 16, 17, 18, 12, 11, 10, 9, 8, 7],
    right: [19, 20, 21, 22, 23, 24, 6, 5, 4, 3, 2, 1],
  };

  const handleRollDice = () => room && canRoll && room.send('rollDice');
  const handleQuit = () => colyseusService.leaveGameRoom().then(onQuit);

  const canRoll = isMyTurn && gameState.dice.length === 0;

  const renderableState = gameState;

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
              {gameState.dice.length > 0 ? (
                gameState.dice.map((value, i) => <Dice key={i} value={value} />)
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