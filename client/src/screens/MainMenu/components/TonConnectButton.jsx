import '../../../styles/TonConnectButton.css'

import { TonConnectButton as TonConnectButtonComponent, useTonWallet } from '@tonconnect/ui-react'

function TonConnectButton() {
  const wallet = useTonWallet()

  return (
    <div className="ton-connect-container">
      <TonConnectButtonComponent />
      {wallet && (
        <div className="wallet-info">
          <p>Connected: {wallet.account.address}</p>
          <p>Chain: {wallet.account.chain}</p>
        </div>
      )}
    </div>
  )
}

export default TonConnectButton