import PropTypes from 'prop-types';
import { TonConnectButton } from '@tonconnect/ui-react';
import '../../styles/SplashScreen.css';

const SplashScreen = ({ onNavigate, isLoading, error }) => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-ton-connect">
          {error && <div className="error-message">{error}</div>}
          {isLoading ? (
            <div className="loading-message">Verifying authentication...</div>
          ) : (
            <TonConnectButton />
          )}
        </div>
      </div>
      <div className="age-restriction">18+ ONLY</div>
    </div>
  );
};

SplashScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

export default SplashScreen;
