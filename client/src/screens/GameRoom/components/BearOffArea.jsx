import PropTypes from 'prop-types';
import './BearOffArea.css';

const BearOffArea = ({ count, player, isHighlighted, onClick }) => {
  const playerClass = `bear-off-area--${player}`;
  const highlightedClass = isHighlighted ? 'bear-off-area--highlighted' : '';

  return (
    <div
      className={`bear-off-area ${playerClass} ${highlightedClass}`}
      onClick={onClick}
    >
      <div className="bear-off-count">{count}</div>
      <div className="bear-off-label">Off</div>
    </div>
  );
};

BearOffArea.propTypes = {
  count: PropTypes.number.isRequired,
  player: PropTypes.oneOf(['white', 'black']).isRequired,
  isHighlighted: PropTypes.bool,
  onClick: PropTypes.func,
};

BearOffArea.defaultProps = {
  isHighlighted: false,
  onClick: () => {},
};

export default BearOffArea;
