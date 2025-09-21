import PropTypes from 'prop-types'
// import { // analyticsService } from '../../../services/// analyticsService'
import '../../../styles/ActionButtons.css'

// Кнопки управления игрой
const ActionButtons = ({ onCreateGame }) => {
  const handleCreateGame = () => {
    console.log('Создание новой игры')
    // analyticsService.trackButtonClick('create_game', 'main-menu')
    // analyticsService.trackEvent('create_game_button_clicked')
    if (onCreateGame) {
      onCreateGame()
    }
  }

  return (
    <div className="action-buttons">
      <button
        onClick={handleCreateGame}
        className="create-game-button"
      >
        CREATE GAME
      </button>
    </div>
  )
}

ActionButtons.propTypes = {
  onCreateGame: PropTypes.func
}

export default ActionButtons