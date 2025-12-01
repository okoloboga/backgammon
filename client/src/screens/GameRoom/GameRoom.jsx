import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './GameRoom.css';
import '../../styles/CreateRoomModal.css'; // Import shared modal styles
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
    noMoves: false,
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
          noMoves: newState.noMoves || false,
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

  const handlePointClick = (pointId) => {
    if (!isMyTurn) return;

    // 1. Handle moving a checker to a highlighted destination
    if (selectedPoint !== null && highlightedPoints.includes(pointId)) {
      const from = selectedPoint;
      const to = pointId;

      room.send('move', { from, to });

      setSelectedPoint(null);
      setHighlightedPoints([]);
      return;
    }

    // 2. Handle selecting a checker to see its possible moves
    const pointData = gameState.board.get(pointId.toString());
    if (pointData && pointData.player === playerColor) {
      const destinations = gameState.possibleMoves
        .map((moveSequence) => {
          // A move sequence is a string like "24-23,23-22"
          const firstMove = moveSequence.split(',')[0];
          const [from, to] = firstMove.split('-');
          // Return the 'to' part if the 'from' part matches the clicked point
          if (from === pointId.toString()) {
            // The destination can be a number or 'off'
            return isNaN(parseInt(to, 10)) ? to : parseInt(to, 10);
          }
          return null;
        })
        .filter((to) => to !== null); // Filter out nulls

      setSelectedPoint(pointId);
      setHighlightedPoints(Array.from(new Set(destinations))); // Use Set to remove duplicate destinations
    } else {
      // Deselect if clicking an invalid point
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

  // Modal state
  const [showQuitConfirmModal, setShowQuitConfirmModal] = useState(false);
  const [showBearOffButton, setShowBearOffButton] = useState(false);
  const [showOpponentLeftModal, setShowOpponentLeftModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (showOpponentLeftModal) {
      const timer = setTimeout(() => {
        onQuit();
      }, 3000); // 3-second delay before quitting

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [showOpponentLeftModal, onQuit]);

  // Effect to control the visibility of the bear-off button
  useEffect(() => {
    const shouldShow = selectedPoint !== null && highlightedPoints.includes('off');
    setShowBearOffButton(shouldShow);
  }, [selectedPoint, highlightedPoints]);

  const handleOpenQuitModal = () => setShowQuitConfirmModal(true);
  const handleCloseQuitModal = () => setShowQuitConfirmModal(false);
  const handleConfirmQuit = () => {
    handleCloseQuitModal();
    handleQuit();
  };

  return (
    <div className="game-room">
      <button onClick={handleOpenQuitModal} className="quit-button-x">
        &times;
      </button>
      <div className="game-content-wrapper">
        <div className="profiles-container">
          <PlayerProfile
            player={blackPlayer}
            align="left"
            playerColor="black"
            bearOffCount={renderableState.off.get('black') || 0}
          />
          <PlayerProfile
            player={whitePlayer}
            align="right"
            playerColor="white"
            bearOffCount={renderableState.off.get('white') || 0}
          />
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
                  onClick={() => handlePointClick(id)}
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
                  onClick={() => handlePointClick(id)}
                  isSelected={selectedPoint === id}
                  isHighlighted={highlightedPoints.includes(id)}
                />
              ))}
            </div>
            <div className={`dice-area ${gameState.dice.length === 4 ? 'dice-area--double' : ''}`}>
              {gameState.dice.length > 0 && !gameState.noMoves ? (
                gameState.dice.map((value, i) => <Dice key={i} value={value} />)
              ) : (
                <button onClick={handleRollDice} disabled={!canRoll} className="dice-roll-button">
                  {isMyTurn ? 'ROLL!' : `waiting...`}
                </button>
              )}
            </div>
          </div>
        </div>
        {showBearOffButton && (
          <button className="bear-off-button" onClick={() => handlePointClick('off')}>
            &rarr;
          </button>
        )}
      </div>
      {gameState.noMoves && (
        <div className="no-moves-overlay">
          <div className="dice-area">
            {gameState.dice.map((value, i) => <Dice key={`no-move-${i}`} value={value} />)}
          </div>
          <p className="no-moves-text">No moves!</p>
        </div>
      )}
      {showOpponentLeftModal && (
        <div className="modal-overlay">
          <div className="create-room-modal" style={{ padding: '24px' }}>
            <h2>Game Over</h2>
            <p>{modalMessage}</p>
            <p>Returning to lobby...</p>
          </div>
        </div>
      )}
      {showQuitConfirmModal && (
        <div className="modal-overlay" onClick={handleCloseQuitModal}>
          <div className="create-room-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form">
              <h2 style={{ color: 'white', textAlign: 'center', marginTop: 0 }}>Confirm Quit</h2>
              <p style={{ color: '#ccc', textAlign: 'center', marginTop: 0, marginBottom: '24px' }}>
                Are you sure you want to quit the game?
              </p>
              <div className="modal-actions">
                <button onClick={handleCloseQuitModal} className="cancel-button">
                  No
                </button>
                <button onClick={handleConfirmQuit} className="create-button destructive">
                  Yes, Quit
                </button>
              </div>
            </div>
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