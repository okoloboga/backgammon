import PropTypes from 'prop-types';
import './Checker.css';

import chipPurpleSvg from '../../../assets/game/chipPurple.svg';
import chipGreenSvg from '../../../assets/game/chipGreen.svg';

const Checker = ({ color, style }) => {
  const image = color === 'white' ? chipPurpleSvg : chipGreenSvg;

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