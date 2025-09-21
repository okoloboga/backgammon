import PropTypes from 'prop-types';
import { useTonWallet, TonConnectButton as TonConnectButtonComponent, useTonConnectUI } from '@tonconnect/ui-react';
import { authService } from '../../../services/authService';
import '../../../styles/TonConnectButton.css';

function TonConnectButton({ isAuthenticated, onAuthChange, isLoading, error }) {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
    authService.clearAuth();
    onAuthChange(false);
  };

  if (isAuthenticated && wallet) {
    return (
      <div className="ton-connect-container">
        <div className="wallet-info">
          <p>✅ Authenticated</p>
          <p>
            Address: {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
          </p>
          <p>Chain: {wallet.account.chain}</p>
          <button onClick={handleDisconnect} className="disconnect-button">
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ton-connect-container">
      {error && <div className="error-message">{error}</div>}
      {isLoading ? (
        <div className="loading-message">Verifying...</div>
      ) : (
        <TonConnectButtonComponent />
      )}
    </div>
  );
}

TonConnectButton.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  onAuthChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

export default TonConnectButton;