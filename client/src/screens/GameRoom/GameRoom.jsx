import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './GameRoom.css';
import BoardPoint from './components/BoardPoint';
import Dice from './components/Dice';
import PlayerProfile from './components/PlayerProfile';
import { colyseusService } from '../../services/colyseusService';

const GameRoom = ({ roomId, onQuit }) => {
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState({
    board: new Map(),
    bar: new Map(),
    off: new Map(),
    currentPlayer: '',
    dice: [],
    winner: '',
    possibleMoves: [],
    players: new Map()
  });
  const [playerColor, setPlayerColor] = useState(null);
  const [debugMessage, setDebugMessage] = useState('Initializing...');
  const isInitialMount = useRef(true);

  const mockPlayer1 = { username: 'Player 1', avatar: '/assets/player1.png' };
  const mockPlayer2 = { username: 'Player 2', avatar: '/assets/icon.png' };

  useEffect(() => {
    setDebugMessage('1. GameRoom mounted. Getting room instance...');
    const roomInstance = colyseusService.getGameRoom();
    console.log('GameRoom: roomInstance =', roomInstance);
    console.log('GameRoom: roomInstance.roomId =', roomInstance?.roomId);
    console.log('GameRoom: expected roomId =', roomId);

    if (roomInstance && roomInstance.roomId === roomId) {
      setDebugMessage('2. Got room instance. Setting room state.');
      
      // Регистрируем обработчики ДО установки room в state
      setDebugMessage('3. Attaching event listeners...');
      roomInstance.onStateChange((newState) => {
        console.log("New game state received:", newState);
        if (newState) {
          // Colyseus Schema объекты имеют свойства, к которым можно обращаться напрямую
          const transformedState = {
            board: newState.board || new Map(),
            bar: newState.bar || new Map(),
            off: newState.off || new Map(),
            currentPlayer: newState.currentPlayer || '',
            dice: newState.dice ? Array.from(newState.dice) : [],
            winner: newState.winner || '',
            possibleMoves: newState.possibleMoves ? Array.from(newState.possibleMoves) : [],
            players: newState.players || new Map()
          };
          console.log("Transformed state:", transformedState);
          setGameState(transformedState);
          
          // Определяем цвет текущего игрока
          if (newState.players && roomInstance.sessionId) {
            const myColor = newState.players.get(roomInstance.sessionId);
            if (myColor) {
              console.log("Setting player color:", myColor);
              setPlayerColor(myColor);
            }
          }
        } else {
          console.log("Invalid state received:", newState);
        }
      });
      
      roomInstance.onMessage("error", (message) => {
        setDebugMessage(`ERROR: Server sent an error: ${JSON.stringify(message)}`);
        console.error("Server error:", message)
      });
      
      roomInstance.onMessage("state_update", (stateData) => {
        console.log("Manual state update received:", stateData);
        // Преобразуем массивы entries обратно в Map
        const transformedState = {
          board: new Map(stateData.board || []),
          bar: new Map(stateData.bar || []),
          off: new Map(stateData.off || []),
          currentPlayer: stateData.currentPlayer || '',
          dice: stateData.dice || [],
          winner: stateData.winner || '',
          possibleMoves: stateData.possibleMoves || [],
          players: new Map(stateData.players || [])
        };
        setGameState(transformedState);
        setDebugMessage('Manual state update applied');
      });
      
      setRoom(roomInstance);
    } else {
      setDebugMessage(`ERROR: Could not find room instance! Expected ${roomId}, found ${roomInstance ? roomInstance.roomId : 'null'}`);
      onQuit();
    }

    // Cleanup: закрываем соединение только если это не первый StrictMode remount
    return () => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        console.log('GameRoom: StrictMode cleanup, not leaving room');
      } else {
        console.log('GameRoom: Real unmount, leaving room');
        colyseusService.leaveGameRoom();
      }
    };
  }, [roomId, onQuit]);

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

  // Функция для преобразования Map в объект для отладки
  const debugState = () => {
    try {
      return JSON.stringify({
        board: Array.from(gameState.board.entries()),
        bar: Array.from(gameState.bar.entries()),
        off: Array.from(gameState.off.entries()),
        currentPlayer: gameState.currentPlayer,
        dice: gameState.dice,
        winner: gameState.winner,
        possibleMoves: gameState.possibleMoves,
        players: Array.from(gameState.players.entries()),
        myColor: playerColor,
      }, null, 2);
    } catch (e) {
      return 'Error serializing state: ' + e.message;
    }
  };

  return (
    <div className="game-room">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px', zIndex: 9999, whiteSpace: 'pre-wrap', textAlign: 'left', fontSize: '10px' }}>
        <p>DEBUG: {debugMessage}</p>
        <p>GAME STATE: {debugState()}</p>
      </div>
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
};

export default GameRoom;