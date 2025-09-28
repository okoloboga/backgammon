import PropTypes from 'prop-types';
import { useState } from 'react';
import { colyseusService } from '../../../services/colyseusService';
import '../../../styles/CreateRoomModal.css';

// Функция для форматирования баланса с точностью до 2 знаков после запятой
const formatBalance = (num) => {
  const rounded = Math.round(num * 100) / 100;
  if (rounded >= 1000000000) return (rounded / 1000000000).toFixed(2) + 'B';
  if (rounded >= 1000000) return (rounded / 1000000).toFixed(2) + 'M';
  if (rounded >= 1000) return (rounded / 1000).toFixed(2) + 'k';
  return rounded.toFixed(2);
};

// Модальное окно для создания комнаты
const CreateRoomModal = ({ isOpen, onClose, balances, onNavigateToGame }) => {
  const [betAmount, setBetAmount] = useState('');
  const [currency, setCurrency] = useState('TON');
  const [debugError, setDebugError] = useState(null);

  const getMaxBet = () => {
    if (balances?.loading) return 0;
    return currency === 'TON' ? balances?.ton || 0 : balances?.ruble || 0;
  };

  const isValidBetAmount = () => {
    if (!betAmount || betAmount === '') return false;
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return false;
    const maxBet = getMaxBet();
    if (amount > maxBet) return false;
    if (currency === 'TON') {
      return amount >= 1.0;
    } else {
      return amount >= 1000;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- START DEBUG CODE ---
    const payload = {
      betAmount: parseFloat(betAmount),
      currency: currency,
    };
    const debugInfo = {
      "--- DEBUG PAYLOAD ---": "MAKE SURE TO CHECK THE TYPES!",
      payload_to_be_sent: payload,
      "payload.betAmount type": typeof payload.betAmount,
      "state.betAmount (raw)": betAmount,
      "state.betAmount type": typeof betAmount,
    };
    setDebugError(JSON.stringify(debugInfo, null, 2));
    // --- END DEBUG CODE ---

    if (isValidBetAmount()) {
      try {
        console.log('Creating a room via HTTP:', payload);
        const { roomId } = await colyseusService.createRoom(payload);
        console.log('Room created with ID:', roomId);

        console.log('Joining room by ID:', roomId);
        const room = await colyseusService.joinRoomById(roomId);
        console.log('Successfully joined room:', room.id);

        onClose();
        setBetAmount('');
        if (onNavigateToGame) {
          onNavigateToGame(room.id);
        }
      } catch (error) {
        console.error('Failed to create or join room:', error);
        // The debug info is already set, so we don't overwrite it with the error.
        // If you want to see the error instead, uncomment the next line.
        // setDebugError(error.message || 'An unknown error occurred.');
      }
      setCurrency('TON');
    }
  };

  const handleClose = () => {
    onClose();
    setBetAmount('');
    setCurrency('TON');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="create-room-modal" onClick={(e) => e.stopPropagation()}>
        {debugError && (
          <div style={{ backgroundColor: 'rgba(255,0,0,0.7)', color: 'white', padding: '10px', margin: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap' }}>
            <pre>{debugError}</pre>
          </div>
        )}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <div className="radio-group">
              <label className={`radio-option ${currency === 'TON' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="currency"
                  value="TON"
                  checked={currency === 'TON'}
                  onChange={(e) => setCurrency(e.target.value)}
                />
                <span className="radio-label">TON</span>
              </label>
              <label className={`radio-option ${currency === 'RUBLE' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="currency"
                  value="RUBLE"
                  checked={currency === 'RUBLE'}
                  onChange={(e) => setCurrency(e.target.value)}
                />
                <span className="radio-label">RUBLE</span>
              </label>
            </div>
          </div>
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
                  : currency === 'TON'
                  ? `Enter amount (min 1.0, max ${formatBalance(getMaxBet())})`
                  : `Enter amount (min 1k, max ${formatBalance(getMaxBet())})`
              }
            />
            {betAmount && parseFloat(betAmount) > getMaxBet() && (
              <div className="error-message">
                Insufficient balance. Max: {formatBalance(getMaxBet())} {currency}
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="cancel-button">
              Cancel
            </button>
            <button
              type="submit"
              className={`create-button ${!isValidBetAmount() ? 'disabled' : ''}`}
              disabled={!isValidBetAmount()}
            >
              Create
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
    ruble: PropTypes.number,
    loading: PropTypes.bool,
  }),
  onNavigateToGame: PropTypes.func.isRequired,
};

export default CreateRoomModal;