
import PropTypes from 'prop-types'; 
import { useState } from 'react'
import '../../../styles/CreateRoomModal.css'

// Модальное окно для создания комнаты
const CreateRoomModal = ({ isOpen, onClose }) => {
  const [roomName, setRoomName] = useState('')
  const [betAmount, setBetAmount] = useState('')
  const [currency, setCurrency] = useState('TON')

  // Проверка валидности суммы ставки
  const isValidBetAmount = () => {
    if (!betAmount || betAmount === '') return false
    const amount = parseFloat(betAmount)
    if (isNaN(amount) || amount <= 0) return false
    
    if (currency === 'TON') {
      return amount >= 1.0
    } else {
      return amount >= 100
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (roomName.trim() && isValidBetAmount()) {
      console.log('Creating a room:', { roomName, betAmount, currency })
      // Здесь будет логика создания комнаты
      onClose()
      setRoomName('')
      setBetAmount('')
      setCurrency('TON')
    }
  }

  const handleClose = () => {
    onClose()
    setRoomName('')
    setBetAmount('')
    setCurrency('TON')
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="create-room-modal" onClick={(e) => e.stopPropagation()}>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
           
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="currency"
                  value="TON"
                  checked={currency === 'TON'}
                  onChange={(e) => setCurrency(e.target.value)}
                />
                <span className="radio-label">TON</span>
              </label>
              <label className="radio-option">
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
              type="text"
              id="betAmount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder={currency === 'TON' ? 'Enter amount (min 1.0)' : 'Enter amount (min 100)'}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="cancel-button">
              Cancel
            </button>
            <button 
              type="submit" 
              className={`create-button ${!roomName.trim() || !isValidBetAmount() ? 'disabled' : ''}`}
              disabled={!roomName.trim() || !isValidBetAmount()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

CreateRoomModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  // Добавьте другие пропсы, если они есть
};

export default CreateRoomModal