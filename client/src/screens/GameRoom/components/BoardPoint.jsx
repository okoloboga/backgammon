import PropTypes from 'prop-types';
import './BoardPoint.css';
import Checker from './Checker';

const BoardPoint = ({ pointId, checkers, isTop }) => {
  const handleClick = () => {
    console.log(`Clicked on point: ${pointId}`);
  };

  const className = `board-point ${isTop ? 'is-top' : 'is-bottom'}`;

  const POINT_HEIGHT = 200;
  const CHECKER_HEIGHT = 25;
  const MAX_CHECKERS_NO_OVERLAP = Math.floor(POINT_HEIGHT / CHECKER_HEIGHT);

  const renderCheckers = () => {
    if (!checkers) return null;

    // Поддерживаем оба формата: {count, color} и {checkers, player}
    const count = checkers.count ?? checkers.checkers;
    const color = checkers.color ?? checkers.player;
    
    if (!count || !color) return null;
    
    const checkersArray = Array.from({ length: count });

    let getPosition;

    if (count <= MAX_CHECKERS_NO_OVERLAP) {
      getPosition = (i) => ({ [isTop ? 'top' : 'bottom']: `${i * CHECKER_HEIGHT}px` });
    } else {
      const overlap = (count * CHECKER_HEIGHT - POINT_HEIGHT) / (count - 1);
      const step = CHECKER_HEIGHT - overlap;
      getPosition = (i) => ({ [isTop ? 'top' : 'bottom']: `${i * step}px` });
    }

    return checkersArray.map((_, i) => {
      const style = {
        ...getPosition(i),
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: getPosition(i)[isTop ? 'top' : 'bottom'],
      };
      return <Checker key={i} color={color} style={style} />;
    });
  };

  return (
    <div className={className} onClick={handleClick} data-point-id={pointId}>
      {renderCheckers()}
    </div>
  );
};

BoardPoint.propTypes = {
  pointId: PropTypes.number.isRequired,
  isTop: PropTypes.bool.isRequired,
  checkers: PropTypes.oneOfType([
    PropTypes.shape({
      count: PropTypes.number,
      color: PropTypes.string,
    }),
    PropTypes.shape({
      checkers: PropTypes.number,
      player: PropTypes.string,
    }),
  ]),
};

export default BoardPoint;