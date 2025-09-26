import { useState, useEffect, useCallback, useRef } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import { authService } from './services/authService';
import SplashScreen from './screens/SplashScreen/SplashScreen';
import MainMenu from './screens/MainMenu/MainMenu';
import GameRoom from './screens/GameRoom/GameRoom';

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [gameRoomId, setGameRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [telegramData, setTelegramData] = useState(null);
  const [user, setUser] = useState(null);

  const [tonConnectUI] = useTonConnectUI();
  const firstProofLoading = useRef(true);

  // Read Telegram data from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tgData = {
      telegramId: params.get('telegram_id'),
      username: params.get('username'),
      avatarUrl: params.get('avatar_url'),
    };
    if (tgData.telegramId) {
      setTelegramData(tgData);
    }

    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userProfile = await authService.getCurrentUserProfile();
          setUser(userProfile);
          setCurrentScreen('main-menu');
        } catch (error) {
          console.error('Failed to load user profile:', error);
          authService.clearAuth();
          setCurrentScreen('splash');
        }
      }
    };
    checkAuth();
  }, []);

  const recreateProofPayload = useCallback(async () => {
    if (firstProofLoading.current) {
      tonConnectUI.setConnectRequestParameters({ state: 'loading' });
      firstProofLoading.current = false;
    }
    try {
      const challengeData = await authService.generateChallenge();
      setClientId(challengeData.clientId);
      if (challengeData.challenge) {
        tonConnectUI.setConnectRequestParameters({
          state: 'ready',
          value: { tonProof: challengeData.challenge },
        });
      } else {
        tonConnectUI.setConnectRequestParameters(null);
      }
    } catch (e) {
      console.error('Failed to generate challenge:', e);
      tonConnectUI.setConnectRequestParameters(null);
    }
  }, [tonConnectUI]);

  useEffect(() => {
    if (firstProofLoading.current) {
      recreateProofPayload();
    }
  }, [recreateProofPayload]);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
      if (!wallet) {
        console.log('Wallet disconnected, resetting state');
        authService.clearAuth();
        setUser(null);
        setError(null);
        setIsLoading(false);
        setCurrentScreen('splash');
        setTimeout(() => tonConnectUI.setConnectRequestParameters(null), 100);
        return;
      }

      if (wallet.connectItems?.tonProof && 'proof' in wallet.connectItems.tonProof) {
        setIsLoading(true);
        setError(null);
        if (!clientId) {
          console.error('Client ID not available for proof verification.');
          setError('Authentication failed. Please try again.');
          setIsLoading(false);
          return;
        }
        try {
          const authResponse = await authService.verifyProof(
            wallet.account,
            wallet.connectItems.tonProof,
            clientId,
            telegramData
          );
          authService.setAuthToken(authResponse.access_token);
          setUser(authResponse.user);
          setCurrentScreen('main-menu');
        } catch (e) {
          console.error('TonProof verification failed:', e);
          setError('Authentication failed. Please try again.');
          tonConnectUI.disconnect();
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, clientId, telegramData]);

  const navigateToMain = () => {
    if (authService.isAuthenticated()) {
      setCurrentScreen('main-menu');
    }
  };

  const navigateToGame = (roomId) => {
    setGameRoomId(roomId);
    setCurrentScreen('game-room');
  };

  const handleQuitGame = () => {
    setGameRoomId(null);
    setCurrentScreen('main-menu');
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {currentScreen === 'splash' && (
        <SplashScreen
          key={`splash-${user ? 'authenticated' : 'not-authenticated'}`}
          onNavigate={navigateToMain}
          isLoading={isLoading}
          error={error}
        />
      )}
      {currentScreen === 'main-menu' && <MainMenu user={user} onNavigateToGame={navigateToGame} />}
      {currentScreen === 'game-room' && <GameRoom roomId={gameRoomId} onQuit={handleQuitGame} />}
    </div>
  );
}

function AppWrapper() {
  return (
    <TonConnectUIProvider manifestUrl="https://backgammon.ruble.website/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  );
}

export default AppWrapper;