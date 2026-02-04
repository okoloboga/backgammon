import { useState } from 'react';
import PropTypes from 'prop-types';
import { tonTransactionService } from '../../../services/tonTransactionService';
import '../../../styles/RoomCard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Карточка игровой комнаты с оппонентом и ставкой
const RoomCard = ({ room, onEnter }) => {
  const { roomId, createdBy, creatorAvatar, betAmount, currency, escrowGameId } = room;
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);

  const truncatedCreator = createdBy.length > 11 ? `${createdBy.substring(0, 11)}...` : createdBy;

  const handleEnterRoom = async () => {
    setIsJoining(true);
    setError(null);

    try {
      // Send blockchain transaction (if not mock mode)
      if (!tonTransactionService.isMockMode() && escrowGameId) {
        const txResult = await tonTransactionService.joinGameTon(
          escrowGameId,
          betAmount
        );
        if (!txResult.success) {
          throw new Error(txResult.error || 'Transaction failed');
        }

        // Verify the join transaction
        await fetch(`${API_BASE_URL}/game-http/verify-join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderAddress: tonTransactionService.getConnectedAddress(),
            gameId: escrowGameId,
          }),
        });
      }

      onEnter(room);
    } catch (err) {
      console.error('Failed to join room:', err);
      setError(err.message);
      setIsJoining(false);
    }
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
          disabled={isJoining}
        >
          {isJoining ? '...' : 'JOIN'}
        </button>
        {error && <div className="join-error">{error}</div>}
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
    escrowGameId: PropTypes.string,
  }).isRequired,
  onEnter: PropTypes.func.isRequired,
};

export default RoomCard;
