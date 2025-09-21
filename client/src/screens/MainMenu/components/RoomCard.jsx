import '../../../styles/RoomCard.css'
import PropTypes from 'prop-types'

// Карточка игровой комнаты с оппонентом и ставкой
const RoomCard = ({ room, onEnter }) => {
  const { roomId, roomName, playersCount, maxPlayers, status, createdBy, betAmount, currency } = room

  const truncatedCreator = createdBy.length > 11 ? `${createdBy.substring(0, 11)}...` : createdBy

  const handleEnterRoom = () => {
    onEnter(roomId)
  }

  return (
    <div className="room-card">
      <div className="room-content">
        <div className="opponent-info">
          <div className="opponent-avatar">
            <span>{createdBy.charAt(0).toUpperCase()}</span>
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
  )
}

RoomCard.propTypes = {
  room: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    opponent: PropTypes.string.isRequired,
    bet: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired
  }).isRequired,
  onEnter: PropTypes.func.isRequired
}

export default RoomCard