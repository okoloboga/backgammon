import '../../../styles/ActionButtons.css'

// Кнопки управления игрой
const ActionButtons = () => {
  const handleCreateGame = () => {
    console.log('Создание новой игры')
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

export default ActionButtons