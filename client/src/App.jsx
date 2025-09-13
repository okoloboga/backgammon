import SplashScreen from './screens/SplashScreen/SplashScreen'
import MainMenu from './screens/MainMenu/MainMenu'
import { useState } from 'react'
import { TonConnectUIProvider } from '@tonconnect/ui-react'

// Основной компонент приложения
function App() {
  const [currentScreen, setCurrentScreen] = useState('splash')

  const handleNewGame = () => {
    setCurrentScreen('main-menu')
  }

  const handleContinue = () => {
    setCurrentScreen('main-menu')
  }

  return (
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
      <div className="min-h-screen bg-dark-bg">
        {currentScreen === 'splash' && <SplashScreen onNewGame={handleNewGame} onContinue={handleContinue} />}
        {currentScreen === 'main-menu' && <MainMenu />}
      </div>
    </TonConnectUIProvider>
  )
}

export default App