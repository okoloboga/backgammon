import { TonConnectButton as TonConnectButtonComponent } from '@tonconnect/ui-react';
import '../../../styles/TonConnectButton.css';

function TonConnectButton() {
  return (
    <div className="ton-connect-container">
      <TonConnectButtonComponent />
    </div>
  );
}

export default TonConnectButton;
