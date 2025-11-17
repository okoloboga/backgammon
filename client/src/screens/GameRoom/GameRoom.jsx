import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './GameRoom.css';
import BoardPoint from './components/BoardPoint';
import Dice from './components/Dice';
import PlayerProfile from './components/PlayerProfile';
import { colyseusService } from '../../services/colyseusService';
import greenLayer from '../../assets/game/greenLayer.png';
import purpleLayer from '../../assets/game/purpleLayer.png';

const isMockMode = import.meta.env.VITE_GAMEROOM_MOCK === 'true';

const createMockGameState = () => {
  const board = new Map();
  board.set('24', { player: 'white', checkers: 15 });
  board.set('1', { player: 'black', checkers: 15 });

  const players = new Map();
  players.set('mock-white', 'white');
  players.set('mock-black', 'black');

  const playerProfiles = new Map();
  playerProfiles.set('mock-white', {
    username: 'You',
    avatar: '/assets/player1.png',
  });
  playerProfiles.set('mock-black', {
    username: 'Opponent',
    avatar: '/assets/icon.png',
  });

  return {
    board,
    bar: new Map([['white', 0], ['black', 0]]),
    off: new Map([['white', 0], ['black', 0]]),
    currentPlayer: 'white',
    dice: [],
    winner: '',
    possibleMoves: [],
    players,
    playerProfiles,
  };
};

const GameRoom = ({ roomId, onQuit, currentUser }) => {
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState(
    isMockMode
      ? createMockGameState()
      : {
          board: new Map(),
          bar: new Map(),
          off: new Map(),
          currentPlayer: '',
          dice: [],
          winner: '',
          possibleMoves: [],
          players: new Map(),
          playerProfiles: new Map(),
        },
  );
  const [playerColor, setPlayerColor] = useState(isMockMode ? 'white' : null);
  const [, setDebugMessage] = useState('Initializing...');
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isMockMode) {
      setDebugMessage('Mock mode active: using local state');
      return undefined;
    }

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
            players: newState.players
              ? new Map(Array.from(newState.players.entries()))
              : new Map(),
            playerProfiles: newState.playerProfiles
              ? new Map(Array.from(newState.playerProfiles.entries()))
              : new Map(),
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
          players: new Map(stateData.players || []),
          playerProfiles: new Map(stateData.playerProfiles || []),
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
  }, [roomId, onQuit, isMockMode]);

  const pointRenderOrder = {
    left: [13, 14, 15, 16, 17, 18, 12, 11, 10, 9, 8, 7],
    right: [19, 20, 21, 22, 23, 24, 6, 5, 4, 3, 2, 1],
  };

  const handleRollDice = () => {
    if (isMockMode) {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const newDice = die1 === die2 ? [die1, die1, die1, die1] : [die1, die2];
      setGameState((prev) => ({
        ...prev,
        dice: newDice,
        currentPlayer: prev.currentPlayer === 'white' ? 'black' : 'white',
      }));
      return;
    }
    return room && canRoll && room.send('rollDice');
  };
  const handleQuit = () => {
    if (isMockMode) {
      onQuit();
      return;
    }
    colyseusService.leaveGameRoom().then(() => {
      onQuit();
    });
  };

  const isMyTurn = playerColor && gameState.currentPlayer === playerColor;
  const canRoll = isMyTurn && gameState.dice.length === 0;

  const playersMap =
    gameState.players instanceof Map
      ? gameState.players
      : new Map(gameState.players ? Array.from(gameState.players.entries()) : []);

  const profilesMap =
    gameState.playerProfiles instanceof Map
      ? gameState.playerProfiles
      : new Map(
          gameState.playerProfiles ? Array.from(gameState.playerProfiles.entries()) : [],
        );

  let whiteSessionId;
  let blackSessionId;
  playersMap.forEach((color, sessionId) => {
    if (color === 'white') whiteSessionId = sessionId;
    if (color === 'black') blackSessionId = sessionId;
  });

  const defaultWhiteProfile = { username: 'Player 1', avatar: '/assets/player1.png' };
  const defaultBlackProfile = { username: 'Player 2', avatar: '/assets/icon.png' };

  const getProfileForSession = (sessionId, defaultProfile) => {
    // Если игрок еще не подключился, показываем "...waiting..."
    if (!sessionId) {
      return {
        username: '...waiting...',
        avatar: '/assets/icon.png',
      };
    }
    const profileFromState = profilesMap.get(sessionId);
    const finalProfile = {
      username: profileFromState?.username || defaultProfile.username,
      avatar: profileFromState?.avatar || defaultProfile.avatar,
    };
    if (room?.sessionId === sessionId && currentUser) {
      return {
        username: currentUser.username || finalProfile.username,
        avatar: currentUser.avatar || finalProfile.avatar,
      };
    }
    return finalProfile;
  };

  const whitePlayer = isMockMode
    ? profilesMap.get('mock-white') || defaultWhiteProfile
    : getProfileForSession(whiteSessionId, defaultWhiteProfile);
  const blackPlayer = isMockMode
    ? profilesMap.get('mock-black') || defaultBlackProfile
    : getProfileForSession(blackSessionId, defaultBlackProfile);

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
                  checkers={gameState.board.get(id.toString())}
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
                  checkers={gameState.board.get(id.toString())}
                />
              ))}
            </div>
            <div className="dice-area">
              {gameState.dice.length > 0 ? (
                // Всегда показываем только первые 2 кости (даже при дубле)
                gameState.dice.slice(0, 2).map((value, i) => <Dice key={i} value={value} />)
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