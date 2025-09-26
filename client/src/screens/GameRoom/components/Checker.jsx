import PropTypes from 'prop-types';
import './Checker.css';

import chipPurple from '../../../assets/game/chipPurple.png';
import chipGreen from '../../../assets/game/chipGreen.png';

const Checker = ({ color, style }) => {
  const image = color === 'white' ? chipPurple : chipGreen;
  
  const finalStyle = {
    ...style,
    width: '25px',
    height: '25px',
  };

  return <img src={image} className="checker" style={finalStyle} alt={`Checker ${color}`} />;
};

Checker.propTypes = {
  color: PropTypes.string,
  style: PropTypes.object,
};

export default Checker;