import '../../styles/SplashScreen.css'
import PropTypes from 'prop-types'

// Экран приветствия приложения
const SplashScreen = ({ onNavigate }) => {
  return (
    <div className="splash-screen">
      <div className="logo-container">
        <h1 className="logo-title">BACKGAMMON</h1>
        <img
          src="/assets/ruble.png"
          alt="Ruble"
          className="logo-image"
          onClick={onNavigate}
        />
        <h1 className="logo-title">RUBLE</h1>
      </div>
    </div>
  )
}

SplashScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired
}

export default SplashScreen