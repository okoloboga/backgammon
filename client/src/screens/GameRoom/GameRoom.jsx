import React, { useState } from 'react';
import './GameRoom.css';
import BoardPoint from './components/BoardPoint';
import Dice from './components/Dice';

import purpleLayer from '../../assets/game/purpleLayer.png';
import greenLayer from '../../assets/game/greenLayer.png';

const initialBoardState = {
  1: { count: 15, color: 'black' },
  24: { count: 15, color: 'white' },
};

const GameRoom = () => {
  const [dice, setDice] = useState([1, 6]);

  const pointRenderOrder = {
    left: [13, 14, 15, 16, 17, 18, 12, 11, 10, 9, 8, 7],
    right: [19, 20, 21, 22, 23, 24, 6, 5, 4, 3, 2, 1],
  };

  const rollDice = () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setDice([d1, d2]);
  };

  return (
    <div className="game-room">
      <div className="game-board">
        <div className="board-half">
          <img src={purpleLayer} className="board-bg" alt="Board background" />
          <div className="point-grid-container">
            {pointRenderOrder.left.map((id) => (
              <BoardPoint
                key={id}
                pointId={id}
                isTop={id >= 13}
                checkers={initialBoardState[id]}
              />
            ))}
          </div>
        </div>

        <div className="board-half">
          <img src={purpleLayer} className="board-bg" alt="Board background" />
          <img src={greenLayer} className="board-bg overlay" alt="Board overlay" />
          <div className="point-grid-container">
            {pointRenderOrder.right.map((id) => (
              <BoardPoint
                key={id}
                pointId={id}
                isTop={id >= 19}
                checkers={initialBoardState[id]}
              />
            ))}
          </div>
          <div className="dice-area" onClick={rollDice}>
            <Dice value={dice[0]} />
            <Dice value={dice[1]} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;