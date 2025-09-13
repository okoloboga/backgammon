import './TonConnectButton.css';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';

function TonConnectButtonComponent() {
  const wallet = useTonWallet();

  return (
    <div className="ton-connect-container">
      <TonConnectButton />
      
      {wallet && (
        <div className="wallet-info">
          <p>Connected: {wallet.account.address}</p>
          <p>Chain: {wallet.account.chain}</p>
        </div>
      )}
    </div>
  );
}

export default TonConnectButtonComponent;