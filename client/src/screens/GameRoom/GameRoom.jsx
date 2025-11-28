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
    remainingDice.forEach(die => {
      const toPoint = fromPoint === 'bar'
        ? (playerColor === 'white' ? 25 - die : die)
        : fromPoint + (die * direction);
      
      // Basic validation (more complex rules like blocking are on server)
      // This is just for highlighting
      const targetPoint = previewState.board.get(toPoint.toString());
      if (!targetPoint || targetPoint.player === playerColor || targetPoint.checkers <= 1) {
        destinations.add(toPoint);
      }
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
      
      // Find which die was used
      const dieIndex = remainingDice.indexOf(distance);
      if (dieIndex === -1) return; // Should not happen if highlighted
      const dieUsed = remainingDice[dieIndex];

      // Optimistically update preview state
      const newPreviewState = JSON.parse(JSON.stringify(previewState, (k, v) => v instanceof Map ? Array.from(v.entries()) : v));
      newPreviewState.board = new Map(newPreviewState.board);
      
      // Decrement 'from' point
      const fromPoint = newPreviewState.board.get(from.toString());
      if (fromPoint) {
        fromPoint.checkers -= 1;
        if (fromPoint.checkers === 0) newPreviewState.board.delete(from.toString());
      }
      
      // Increment 'to' point
      const toPoint = newPreviewState.board.get(to.toString()) || { player: playerColor, checkers: 0 };
      toPoint.checkers += 1;
      toPoint.player = playerColor;
      newPreviewState.board.set(to.toString(), toPoint);
      
      setPreviewState(newPreviewState);

      // Update move sequence
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
    // Find the full move sequence string that matches our completed moves
    const moveString = currentMoves.map(m => `${m.from}-${m.to}`).join(',');
    if (gameState.possibleMoves.includes(moveString)) {
      room.send('move', moveString);
    } else {
      // This indicates a mismatch between client/server logic, for now, just undo
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
  const canConfirm = currentMoves.length > 0 && remainingDice.length === 0; // Or no more possible moves

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
