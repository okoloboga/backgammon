import PropTypes from 'prop-types';
import { useState } from 'react';
import '../../../styles/CreateRoomModal.css';
import { useWalletBalances } from '../../../hooks/useWalletBalances';
// import { // analyticsService } from '../../../services/// analyticsService';

// Модальное окно для создания комнаты
const CreateRoomModal = ({ isOpen, onClose }) => {
  const [betAmount, setBetAmount] = useState('');
  const [currency, setCurrency] = useState('TON');
  const { balanceTon, balanceRuble } = useWalletBalances();

  // Проверка валидности суммы ставки
  const isValidBetAmount = () => {
    if (!betAmount || betAmount === '') return false;
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return false;

    const selectedBalance = currency === 'TON' ? balanceTon : balanceRuble;
    if (amount > selectedBalance) {
      return false; // Ставка не может превышать баланс
    }

    if (currency === 'TON') {
      return amount >= 1.0;
    } else {
      return amount >= 100;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValidBetAmount()) {
      console.log('Creating a room:', { betAmount, currency });
      // analyticsService.trackRoomCreated('public', 2);
      // analyticsService.trackEvent('room_creation_attempt', {
      //   bet_amount: parseFloat(betAmount),
      //   currency: currency
      // });
      // Здесь будет логика создания комнаты
      onClose();
      setBetAmount('');
      setCurrency('TON');
    } else {
      // analyticsService.trackError('validation', 'invalid_bet_amount', 'create_room_modal');
    }
  };

  const handleClose = () => {
    // analyticsService.trackButtonClick('cancel', 'create_room_modal');
    onClose();
    setBetAmount('');
    setCurrency('TON');
  };

  if (!isOpen) return null;

  const selectedBalance = currency === 'TON' ? balanceTon : balanceRuble;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="create-room-modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <div className="radio-group">
              <label className={`radio-option ${currency === 'TON' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="currency"
                  value="TON"
                  checked={currency === 'TON'}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    // analyticsService.trackEvent('currency_selected', { currency: 'TON' });
                  }}
                />
                <span className="radio-label">TON</span>
              </label>
              <label className={`radio-option ${currency === 'RUBLE' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="currency"
                  value="RUBLE"
                  checked={currency === 'RUBLE'}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    // analyticsService.trackEvent('currency_selected', { currency: 'RUBLE' });
                  }}
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
              placeholder={currency === 'TON' ? 'Enter amount (min 1.0)' : 'Enter amount (min 100)'}
            />
            <div className="balance-info">
              Available: {selectedBalance.toFixed(2)} {currency}
            </div>
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
  onCreate: PropTypes.func.isRequired,
  // Добавьте другие пропсы, если они есть
};

export default CreateRoomModal;