import PropTypes from 'prop-types'
import '../../../styles/ActionButtons.css'

// Кнопки управления игрой
const ActionButtons = ({ onCreateGame }) => {
  const handleCreateGame = () => {
    console.log('Создание новой игры')
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