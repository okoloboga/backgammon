import React from 'react';
import './Checker.css';

import chipPurple from '../../../assets/game/chipPurple.png';
import chipGreen from '../../../assets/game/chipGreen.png';

const Checker = ({ color, style }) => {
  const image = color === 'white' ? chipPurple : chipGreen;
  
  // Принудительно задаем размер через inline-стили для надежности
  const finalStyle = {
    ...style,
    width: '25px',
    height: '25px',
  };

  return <img src={image} className="checker" style={finalStyle} alt={`Checker ${color}`} />;
};

export default Checker;
