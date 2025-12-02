import PropTypes from 'prop-types';
import '../../../styles/RoomCard.css';

// Карточка игровой комнаты с оппонентом и ставкой
const RoomCard = ({ room, onEnter }) => {
  const { roomId, createdBy, creatorAvatar, betAmount, currency } = room;

  const truncatedCreator = createdBy.length > 11 ? `${createdBy.substring(0, 11)}...` : createdBy;

  const handleEnterRoom = () => {
    onEnter(room);
  };

  return (
    <div className="room-card">
      <div className="room-content">
        <div className="opponent-info">
          <div className="opponent-avatar">
            {creatorAvatar ? (
              <img src={creatorAvatar} alt={createdBy} />
            ) : (
              <span>{createdBy.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="opponent-details">
            <h3>{truncatedCreator}</h3>
            <span className={`currency-badge currency-${currency.toLowerCase()}`}>
              {currency}
            </span>
          </div>
        </div>

        <div className="game-info">
          <div className="bet-info">
            <img
              src="/assets/diamond.png"
              alt="Diamond"
              className="balance-icon"
            />
            <span className="bet-amount">{betAmount}</span>
          </div>
        </div>

        <button
          onClick={handleEnterRoom}
          className="enter-button"
        >
          JOIN
        </button>
      </div>
    </div>
  );
};

RoomCard.propTypes = {
  room: PropTypes.shape({
    roomId: PropTypes.string.isRequired,
    createdBy: PropTypes.string.isRequired,
    creatorAvatar: PropTypes.string,
    betAmount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
  }).isRequired,
  onEnter: PropTypes.func.isRequired,
};

export default RoomCard;
