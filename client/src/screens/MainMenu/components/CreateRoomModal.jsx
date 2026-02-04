import PropTypes from 'prop-types';
import { useState } from 'react';
import { colyseusService } from '../../../services/colyseusService';
import { tonTransactionService } from '../../../services/tonTransactionService';
import '../../../styles/CreateRoomModal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || `${window.location.origin}/api`;

// Функция для форматирования баланса с точностью до 2 знаков после запятой
const formatBalance = (num) => {
  const rounded = Math.round(num * 100) / 100;
  if (rounded >= 1000000000) return (rounded / 1000000000).toFixed(2) + 'B';
  if (rounded >= 1000000) return (rounded / 1000000).toFixed(2) + 'M';
  if (rounded >= 1000) return (rounded / 1000).toFixed(2) + 'k';
  return rounded.toFixed(2);
};

// Модальное окно для создания комнаты
const CreateRoomModal = ({ isOpen, onClose, balances, onNavigateToGame, user }) => {
  const [betAmount, setBetAmount] = useState('');
  const [debugError, setDebugError] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currency = 'TON';

  const getMaxBet = () => {
    if (balances?.loading) return 0;
    return balances?.ton || 0;
  };

  const isValidBetAmount = () => {
    if (!betAmount || betAmount === '') return false;
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return false;
    if (amount > getMaxBet()) return false;
    return amount >= 1.0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidBetAmount()) return;

    setIsProcessing(true);
    setDebugError(null);
    let escrowGameId = null;

    try {
      // 1. Send blockchain transaction (if not mock mode)
      if (!tonTransactionService.isMockMode()) {
        setTxStatus('Signing transaction...');
        const txResult = await tonTransactionService.createGameTon(parseFloat(betAmount));

        if (!txResult.success) {
          throw new Error(txResult.error || 'Transaction failed');
        }

        setTxStatus('Verifying transaction...');
        const verifyRes = await fetch(`${API_BASE_URL}/game-http/verify-create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderAddress: tonTransactionService.getConnectedAddress(),
            expectedAmount: parseFloat(betAmount),
          }),
        });
        const verifyData = await verifyRes.json();
        escrowGameId = verifyData.gameId?.toString();

        if (!escrowGameId) {
          console.warn('Could not verify escrow gameId, proceeding without it');
        }
      }

      // 2. Create Colyseus room
      setTxStatus('Creating room...');
      const reservation = await colyseusService.createRoom({
        betAmount: parseFloat(betAmount),
        currency,
        escrowGameId,
        creatorUsername: user?.username || 'Player',
        creatorAvatar: user?.avatar,
      });

      // 3. Join and navigate to game
      const room = await colyseusService.joinWithReservation(reservation);

      onClose();
      setBetAmount('');
      if (onNavigateToGame) {
        const resolvedRoomId = room?.id || room?.roomId;
        onNavigateToGame({
          roomId: resolvedRoomId,
          betAmount: parseFloat(betAmount),
          currency,
          escrowGameId,
        });
      }
    } catch (error) {
      console.error('Failed to create or join room:', error);
      setDebugError(`ERROR: ${error.message}\n\nSTACK: ${error.stack}`);
    } finally {
      setIsProcessing(false);
      setTxStatus(null);
    }
  };

  const handleClose = () => {
    onClose();
    setBetAmount('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="create-room-modal" onClick={(e) => e.stopPropagation()}>
        {debugError && (
          <div style={{ backgroundColor: 'red', color: 'white', padding: '10px', margin: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            <pre><code>{debugError}</code></pre>
          </div>
        )}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              id="betAmount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder={
                balances?.loading
                  ? 'Loading balance...'
                  : `Enter amount (min 1.0, max ${formatBalance(getMaxBet())})`
              }
            />
            {betAmount && parseFloat(betAmount) > getMaxBet() && (
              <div className="error-message">
                Insufficient balance. Max: {formatBalance(getMaxBet())} TON
              </div>
            )}
          </div>
          {isProcessing && txStatus && (
            <div className="tx-status">{txStatus}</div>
          )}
          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="cancel-button" disabled={isProcessing}>
              Cancel
            </button>
            <button
              type="submit"
              className={`create-button ${!isValidBetAmount() || isProcessing ? 'disabled' : ''}`}
              disabled={!isValidBetAmount() || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateRoomModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  balances: PropTypes.shape({
    ton: PropTypes.number,
    loading: PropTypes.bool,
  }),
  onNavigateToGame: PropTypes.func.isRequired,
  user: PropTypes.object,
};

export default CreateRoomModal;
