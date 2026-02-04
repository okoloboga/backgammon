import PropTypes from 'prop-types';
import { tonTransactionService } from '../../../services/tonTransactionService';
import '../../../styles/CreateRoomModal.css';

const GameFinished = ({
  isWinner,
  betAmount,
  currency,
  txHash,
  onClose
}) => {
  const prizeAmount = betAmount * 2;

  return (
    <div className="modal-overlay">
      <div className="create-room-modal" style={{ padding: '24px', textAlign: 'center', minWidth: '320px' }}>
        {/* Win/Lose Message */}
        {isWinner ? (
          <p style={{ color: '#2E8B57', fontSize: '2em', margin: 0, fontWeight: 'bold' }}>
            WIN
          </p>
        ) : (
          <p style={{ color: '#DC143C', fontSize: '2em', margin: 0, fontWeight: 'bold' }}>
            LOSE
          </p>
        )}

        {/* Prize/Loss Amount */}
        <p style={{ color: 'white', fontSize: '1.5em', margin: '10px 0' }}>
          {isWinner ? `${prizeAmount} ${currency}` : `-${betAmount} ${currency}`}
        </p>

        {/* Transaction link */}
        {txHash && (
          <a
            href={tonTransactionService.getExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#4da6ff',
              fontSize: '0.9em',
              marginTop: '10px',
              display: 'block',
              textDecoration: 'underline'
            }}
          >
            View transaction
          </a>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="cancel-button"
          style={{ marginTop: '20px', width: '100%', maxWidth: '200px' }}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};

GameFinished.propTypes = {
  isWinner: PropTypes.bool.isRequired,
  betAmount: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  txHash: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

GameFinished.defaultProps = {
  txHash: null,
};

export default GameFinished;
