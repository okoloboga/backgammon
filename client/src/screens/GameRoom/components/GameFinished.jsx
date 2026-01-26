import PropTypes from 'prop-types';
import { useState } from 'react';
import { tonTransactionService } from '../../../services/tonTransactionService';
import '../../../styles/CreateRoomModal.css';

const GameFinished = ({
  isWinner,
  betAmount,
  currency,
  escrowGameId,
  txHash,
  onClose
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null);
  const [claimTxHash, setClaimTxHash] = useState(null);
  const [claimError, setClaimError] = useState(null);

  const prizeAmount = betAmount * 2;
  const isRuble = currency === 'RUBLE';
  const isTon = currency === 'TON';

  const handleClaim = async () => {
    if (!escrowGameId) {
      setClaimError('Game ID not available');
      return;
    }

    setIsClaiming(true);
    setClaimStatus('Signing transaction...');
    setClaimError(null);

    try {
      const result = await tonTransactionService.claimJettonWinnings(BigInt(escrowGameId));

      if (result.success) {
        setClaimStatus('Claimed successfully!');
        setClaimTxHash(result.txHash);
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setClaimError(result.error || 'Claim failed');
        setClaimStatus(null);
      }
    } catch (error) {
      console.error('Claim error:', error);
      setClaimError(error.message || 'Claim failed');
      setClaimStatus(null);
    } finally {
      setIsClaiming(false);
    }
  };

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

        {/* TON: Show transaction link */}
        {isTon && txHash && (
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

        {/* RUBLE: Show claim button for winner */}
        {isRuble && isWinner && (
          <div style={{ marginTop: '20px' }}>
            {!claimStatus && !claimError && (
              <>
                <p style={{ color: '#ccc', fontSize: '0.9em', marginBottom: '10px' }}>
                  Click below to claim your winnings
                </p>
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="create-button"
                  style={{ width: '100%', maxWidth: '200px' }}
                >
                  {isClaiming ? 'Processing...' : 'Claim Winnings'}
                </button>
              </>
            )}

            {claimStatus && (
              <p style={{ color: '#2E8B57', fontSize: '1em', marginTop: '10px' }}>
                {claimStatus}
              </p>
            )}

            {claimTxHash && (
              <a
                href={tonTransactionService.getExplorerUrl(claimTxHash)}
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
                View claim transaction
              </a>
            )}

            {claimError && (
              <p style={{ color: '#DC143C', fontSize: '0.9em', marginTop: '10px' }}>
                {claimError}
              </p>
            )}
          </div>
        )}

        {/* Close button */}
        {(!isRuble || !isWinner || claimStatus) && (
          <button
            onClick={onClose}
            className="cancel-button"
            style={{ marginTop: '20px', width: '100%', maxWidth: '200px' }}
          >
            Back to Menu
          </button>
        )}
      </div>
    </div>
  );
};

GameFinished.propTypes = {
  isWinner: PropTypes.bool.isRequired,
  betAmount: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  escrowGameId: PropTypes.string,
  txHash: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

GameFinished.defaultProps = {
  escrowGameId: null,
  txHash: null,
};

export default GameFinished;
