import telegramAnalytics from '@telegram-apps/analytics';

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.analyticsToken = import.meta.env.VITE_ANALYTICS_TOKEN;
    this.appName = import.meta.env.VITE_ANALYTICS_APP_NAME || 'Backgammon Game';
  }

  init() {
    if (this.isInitialized || !this.analyticsToken) {
      console.warn('Analytics token not provided or already initialized');
      return;
    }

    try {
      telegramAnalytics.init({
        token: this.analyticsToken,
        appName: this.appName,
      });
      this.isInitialized = true;
      console.log('Telegram Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Telegram Analytics:', error);
    }
  }

  trackEvent(eventName, properties = {}) {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized, skipping event:', eventName);
      return;
    }

    try {
      telegramAnalytics.trackEvent(eventName, properties);
      console.log('Event tracked:', eventName, properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Специфичные события для игры в нарды
  trackGameStart(gameType = 'backgammon', gameMode = 'classic') {
    this.trackEvent('game_started', { 
      game_type: gameType, 
      game_mode: gameMode 
    });
  }

  trackGameEnd(gameType = 'backgammon', result = 'unknown', duration = 0) {
    this.trackEvent('game_ended', { 
      game_type: gameType, 
      result: result,
      duration: duration
    });
  }

  trackGameMove(moveType, from, to) {
    this.trackEvent('game_move', { 
      move_type: moveType,
      from: from,
      to: to
    });
  }

  trackWalletConnected(walletType = 'ton') {
    this.trackEvent('wallet_connected', { wallet_type: walletType });
  }

  trackWalletDisconnected() {
    this.trackEvent('wallet_disconnected');
  }

  trackRoomCreated(roomType = 'public', maxPlayers = 2) {
    this.trackEvent('room_created', { 
      room_type: roomType,
      max_players: maxPlayers
    });
  }

  trackRoomJoined(roomId, roomType = 'public') {
    this.trackEvent('room_joined', { 
      room_id: roomId,
      room_type: roomType
    });
  }

  trackRoomLeft(roomId) {
    this.trackEvent('room_left', { room_id: roomId });
  }

  trackPaymentInitiated(amount, currency = 'TON', paymentType = 'game_entry') {
    this.trackEvent('payment_initiated', { 
      amount: amount, 
      currency: currency,
      payment_type: paymentType
    });
  }

  trackPaymentCompleted(amount, currency = 'TON', paymentType = 'game_entry') {
    this.trackEvent('payment_completed', { 
      amount: amount, 
      currency: currency,
      payment_type: paymentType
    });
  }

  trackPaymentFailed(amount, currency = 'TON', error = 'unknown') {
    this.trackEvent('payment_failed', { 
      amount: amount, 
      currency: currency,
      error: error
    });
  }

  trackUserRegistration(method = 'telegram') {
    this.trackEvent('user_registered', { method: method });
  }

  trackUserLogin(method = 'telegram') {
    this.trackEvent('user_logged_in', { method: method });
  }

  trackScreenView(screenName) {
    this.trackEvent('screen_viewed', { screen_name: screenName });
  }

  trackButtonClick(buttonName, screenName = 'unknown') {
    this.trackEvent('button_clicked', { 
      button_name: buttonName,
      screen_name: screenName
    });
  }

  trackError(errorType, errorMessage, screenName = 'unknown') {
    this.trackEvent('error_occurred', { 
      error_type: errorType,
      error_message: errorMessage,
      screen_name: screenName
    });
  }

  trackPerformance(metric, value, unit = 'ms') {
    this.trackEvent('performance_metric', { 
      metric: metric,
      value: value,
      unit: unit
    });
  }
}

export const analyticsService = new AnalyticsService();