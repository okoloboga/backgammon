import { useState, useEffect, useCallback, useRef } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import { authService } from './services/authService';
import { colyseusService } from './services/colyseusService';
import SplashScreen from './screens/SplashScreen/SplashScreen';
import MainMenu from './screens/MainMenu/MainMenu';
import GameRoom from './screens/GameRoom/GameRoom';

const forceGameRoom = import.meta.env.VITE_FORCE_GAMEROOM === 'true';
const mockRoomId = 'dev-room';

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [gameRoomId, setGameRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [telegramData, setTelegramData] = useState(null);
  const [user, setUser] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null); // NEW: State to hold room details

  const [tonConnectUI] = useTonConnectUI();
  const firstProofLoading = useRef(true);

  // Read Telegram data from URL on mount
  useEffect(() => {
    const preSplashScreen = document.getElementById('pre-splash-screen');
    if (preSplashScreen) {
      setTimeout(() => {
        preSplashScreen.style.display = 'none';
      }, 2000);
    }
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

      // Case 1: We received a proof. This happens after user signs.
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
      } else {
        // Case 2: Wallet is connected, but no proof is present.
        // This can happen on page load with a pre-connected wallet.
        // If we aren't authenticated with our backend yet, we need a proof.
        if (!authService.isAuthenticated()) {
          console.log('Wallet is connected, but no proof. Requesting new proof payload.');
          recreateProofPayload();
        }
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, clientId, telegramData, recreateProofPayload]);

  const navigateToMain = () => {
    if (authService.isAuthenticated()) {
      setCurrentScreen('main-menu');
    }
  };

  const navigateToGame = useCallback(async (info) => { // Changed parameter to 'info' object
    if (!info || !info.roomId) {
      console.error("navigateToGame called with no roomId");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentRoom = colyseusService.getGameRoom();
      // Check if we are already in the correct room
      if (currentRoom && currentRoom.roomId === info.roomId) {
        console.log('Already in the correct room. Navigating...');
      } else {
        console.log(`Joining room ${info.roomId}...`);
        await colyseusService.joinExistingRoom(info.roomId);
      }
      
      setGameRoomId(info.roomId);
      setRoomInfo(info); // Store the full room info
      setCurrentScreen('game-room');
    } catch (e) {
      console.error(`Failed to navigate to game room ${info.roomId}:`, e);
      setError('Failed to join the game. Please try again.');
      // Go back to the main menu on failure
      setCurrentScreen('main-menu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQuitGame = useCallback(async () => {
    setGameRoomId(null);
    setRoomInfo(null); // Clear room info on quit
    setCurrentScreen('main-menu');

    // Reload user profile to get updated stats after game
    try {
      const updatedProfile = await authService.getCurrentUserProfile();
      setUser(updatedProfile);
    } catch (error) {
      console.error('Failed to reload user profile:', error);
    }
  }, []);

  // Этот хук будет следить за состоянием пользователя и переключать экран
  useEffect(() => {
    if (user) {
      setCurrentScreen('main-menu');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      colyseusService.setPlayerProfile({
        username: user.username,
        avatar: user.avatar,
      });
    } else {
      colyseusService.setPlayerProfile(null);
    }
  }, [user]);

  if (forceGameRoom) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <GameRoom roomId={mockRoomId} onQuit={() => {}} currentUser={user} />
      </div>
    );
  }

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
      {currentScreen === 'game-room' && (
        <GameRoom
          roomId={gameRoomId}
          betAmount={roomInfo?.betAmount} // Pass betAmount
          currency={roomInfo?.currency}   // Pass currency
          onQuit={handleQuitGame}
          currentUser={user}
        />
      )}
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