import PropTypes from 'prop-types';
import './Dice.css';

import d1 from '../../../assets/game/d1.png';
import d2 from '../../../assets/game/d2.png';
import d3 from '../../../assets/game/d3.png';
import d4 from '../../../assets/game/d4.png';
import d5 from '../../../assets/game/d5.png';
import d6 from '../../../assets/game/d6.png';

const diceImages = { 1: d1, 2: d2, 3: d3, 4: d4, 5: d5, 6: d6 };

const Dice = ({ value }) => {
  const image = diceImages[value] || d1; // d1 as fallback
  return <img src={image} className="dice-image" alt={`Dice value ${value}`} />;
};

Dice.propTypes = {
  value: PropTypes.number.isRequired,
};

export default Dice;