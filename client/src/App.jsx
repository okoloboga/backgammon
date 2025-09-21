import { useState, useEffect, useCallback, useRef } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import { authService } from './services/authService';
import SplashScreen from './screens/SplashScreen/SplashScreen';
import MainMenu from './screens/MainMenu/MainMenu';

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [tonConnectUI] = useTonConnectUI();
  const firstProofLoading = useRef(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        setCurrentScreen('main-menu');
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
        authService.clearAuth();
        setIsAuthenticated(false);
        setError(null);
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
            clientId
          );
          authService.setAuthToken(authResponse.access_token);
          setIsAuthenticated(true);
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
  }, [tonConnectUI, clientId]);

  const handleAuthChange = (authenticated) => {
    setIsAuthenticated(authenticated);
    if (!authenticated) {
      setCurrentScreen('splash');
    }
  };

  const navigateToMain = () => {
    if (authService.isAuthenticated()) {
      setCurrentScreen('main-menu');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {currentScreen === 'splash' && (
        <SplashScreen
          onNavigate={navigateToMain}
          isLoading={isLoading}
          error={error}
        />
      )}
      {currentScreen === 'main-menu' && (
        <MainMenu
          isAuthenticated={isAuthenticated}
          onAuthChange={handleAuthChange}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
}

function AppWrapper() {
  return (
    <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  );
}

export default AppWrapper;