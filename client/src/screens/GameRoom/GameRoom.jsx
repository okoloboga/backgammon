import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './GameRoom.css';
import BoardPoint from './components/BoardPoint';
import Dice from './components/Dice';
import PlayerProfile from './components/PlayerProfile';
import { colyseusService } from '../../services/colyseusService';

const GameRoom = ({ roomId, onQuit, debugInfo }) => {
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);

  const mockPlayer1 = { username: 'Player 1', avatar: '/assets/player1.png' };
  const mockPlayer2 = { username: 'Player 2', avatar: '/assets/icon.png' };

  useEffect(() => {
    const roomInstance = colyseusService.getGameRoom();

    if (roomInstance && roomInstance.id === roomId) {
      setRoom(roomInstance);
    } else {
      // This block should not be hit in the normal flow
      // but is a fallback for e.g. page reloads.
      console.error("ERROR: GameRoom loaded without a valid room instance.");
      setTimeout(() => onQuit(), 5000);
    }

    return () => {
      colyseusService.leaveGameRoom();
    };
  }, [roomId, onQuit]);

  useEffect(() => {
    if (room) {
      room.onStateChange((newState) => {
        console.log("New game state received:", newState.toJSON());
        setGameState(newState);
      });
      room.onMessage("error", (message) => console.error("Server error:", message));
    }
  }, [room]);

  const pointRenderOrder = {
    left: [13, 14, 15, 16, 17, 18, 12, 11, 10, 9, 8, 7],
    right: [19, 20, 21, 22, 23, 24, 6, 5, 4, 3, 2, 1],
  };

  const handleRollDice = () => room && canRoll && room.send('rollDice');
  const handleQuit = () => {
    colyseusService.leaveGameRoom().then(() => {
      onQuit();
    });
  };

  if (!gameState) {
    return <div className="game-room"><h1>Joining game...</h1></div>;
  }
  
  if (gameState.players.size < 2) {
    return <div className="game-room"><h1>Waiting for opponent...</h1></div>;
  }

  const isMyTurn = playerColor && gameState.currentPlayer === playerColor;
  const canRoll = isMyTurn && gameState.dice.length === 0;

  const whitePlayer = mockPlayer1;
  const blackPlayer = mockPlayer2;

  return (
    <div className="game-room">
      {debugInfo && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px', zIndex: 9999, whiteSpace: 'pre-wrap' }}>{debugInfo}</div>}
      <button onClick={handleQuit} className="quit-button">Quit</button>
      <div className="game-area-wrapper">
        <div className="profiles-container">
            <PlayerProfile player={blackPlayer} align="left" />
            <PlayerProfile player={whitePlayer} align="right" />
        </div>
        <div className="game-board">
          <div className="board-half">
            <div className="point-grid-container">
              {pointRenderOrder.left.map((id) => (
                <BoardPoint
                  key={id}
                  pointId={id}
                  isTop={id >= 13}
                  checkers={gameState.board.get(id.toString())}
                />
              ))}
            </div>
          </div>
          <div className="board-half">
            <div className="point-grid-container">
              {pointRenderOrder.right.map((id) => (
                <BoardPoint
                  key={id}
                  pointId={id}
                  isTop={id >= 19}
                  checkers={gameState.board.get(id.toString())}
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
    </div>
  );
};

GameRoom.propTypes = {
  roomId: PropTypes.string.isRequired,
  onQuit: PropTypes.func.isRequired,
  debugInfo: PropTypes.string,
};

export default GameRoom;