import PropTypes from 'prop-types';
import { TonConnectButton } from '@tonconnect/ui-react';
import '../../styles/SplashScreen.css';

const SplashScreen = ({ onNavigate, isLoading, error }) => {
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

        <div className="splash-ton-connect">
          {error && <div className="error-message">{error}</div>}
          {isLoading ? (
            <div className="loading-message">Verifying authentication...</div>
          ) : (
            <TonConnectButton />
          )}
        </div>
      </div>
    </div>
  );
};

SplashScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

export default SplashScreen;