import * as colyseus from 'colyseus.js';
import { authService } from './authService';

// Адрес вашего игрового сервера Colyseus (можно переопределить через .env)
const COLYSEUS_ENDPOINT = import.meta.env.VITE_COLYSEUS_ENDPOINT
  || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api`;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || `${window.location.origin}/api`;

class ColyseusService {
  constructor() {
    this.client = new colyseus.Client(COLYSEUS_ENDPOINT);
    this.lobby = null;
    this.gameRoom = null; // Добавляем свойство для хранения игровой комнаты
    this.playerProfile = null;
  }

  setPlayerProfile(profile) {
    this.playerProfile = profile;
  }

  async createRoom(options = {}) {
    const token = authService.getAuthToken();
    const res = await fetch(`${API_BASE_URL}/game-http/create_room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(options),
    });
    if (!res.ok) throw new Error('Failed to create game room');
    const data = await res.json();
    return data;
  }

async joinWithReservation(reservation) {
  if (this.gameRoom) await this.leaveGameRoom();
  console.log('Using reservation:', reservation);
  try {
    // Проверяем, что у нас есть все нужные поля
    if (!reservation.roomId || !reservation.sessionId || !reservation.processId) {
      throw new Error(`Invalid reservation data: ${JSON.stringify(reservation)}`);
    }

    // Используем joinById с sessionId из резервации
    const joinOptions = {
      sessionId: reservation.sessionId,
      username: this.playerProfile?.username,
      avatar: this.playerProfile?.avatar,
      accessToken: authService.getAuthToken(),
    };
    this.gameRoom = await this.client.joinById(reservation.roomId, joinOptions);
    this.setupReconnection(this.gameRoom);
    console.log(`Successfully joined game room: ${this.gameRoom.name} (${this.gameRoom.id})`);
    console.log('Full room object:', this.gameRoom);
    console.log('Room state:', this.gameRoom.state);
    return this.gameRoom;
  } catch (e) {
    console.error('Failed to join with reservation:', e);
    console.error('Reservation data was:', reservation);
    this.gameRoom = null;
    throw e;
  }
}

  // ... (существующие методы лобби)

  /**
   * Подключается к игровой комнате или создает новую.
   * @param {string} roomName - Имя комнаты для подключения (e.g., 'backgammon_room').
   * @param {object} options - Опции, передаваемые при создании комнаты.
   * @returns {Promise<colyseus.Room>}
   */
  async joinGameRoom(roomName = 'backgammon_room', options = {}) {
    if (this.gameRoom) {
      console.warn('Already connected to a game room. Leaving the old one.');
      await this.leaveGameRoom();
    }
    try {
      const joinOptions = {
        ...options,
        username: this.playerProfile?.username,
        avatar: this.playerProfile?.avatar,
        accessToken: authService.getAuthToken(),
      };
      this.gameRoom = await this.client.joinOrCreate(roomName, joinOptions);
      this.setupReconnection(this.gameRoom);
      console.log(`Successfully joined game room: ${this.gameRoom?.name} (${this.gameRoom?.id})`);
      return this.gameRoom;
    } catch (e) {
      console.error(`Failed to join game room '${roomName}':`, e);
      this.gameRoom = null;
      throw e;
    }
  }

  async joinExistingRoom(roomId, options = {}) {
    if (this.gameRoom) {
      console.warn('Already connected to a game room. Leaving the old one.');
      await this.leaveGameRoom();
    }
    try {
      const joinOptions = {
        ...options,
        username: this.playerProfile?.username,
        avatar: this.playerProfile?.avatar,
        accessToken: authService.getAuthToken(),
      };
      this.gameRoom = await this.client.joinById(roomId, joinOptions);
      this.setupReconnection(this.gameRoom);
      console.log(`Successfully joined existing game room: ${this.gameRoom?.name} (${this.gameRoom?.id})`);
      return this.gameRoom;
    } catch (e) {
      console.error(`Failed to join existing game room '${roomId}':`, e);
      this.gameRoom = null;
      throw e;
    }
  }

  setupReconnection(room) {
    if (!room) return;

    // Save reconnection token
    room.onLeave((code) => {
      console.log(`Left room with code: ${code}`);

      // If disconnected unexpectedly (code 1006 = abnormal closure), try to reconnect
      if (code === 1006 || code === 1001) {
        console.log('Connection lost. Attempting to reconnect...');
        this.attemptReconnection(room);
      }
    });
  }

  async attemptReconnection(oldRoom) {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Reconnection attempt ${i + 1}/${maxRetries}...`);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));

        // Try to reconnect to the same room using reconnection token
        const reconnectOptions = {
          username: this.playerProfile?.username,
          avatar: this.playerProfile?.avatar,
          accessToken: authService.getAuthToken(),
        };

        this.gameRoom = await this.client.reconnect(oldRoom.reconnectionToken, reconnectOptions);
        console.log('Successfully reconnected to game room!');
        this.setupReconnection(this.gameRoom);
        return this.gameRoom;
      } catch (e) {
        console.error(`Reconnection attempt ${i + 1} failed:`, e);

        if (i === maxRetries - 1) {
          console.error('All reconnection attempts failed');
          this.gameRoom = null;
        }
      }
    }
  }

  /**
   * Отключается от текущей игровой комнаты.
   */
  async leaveGameRoom() {
    if (this.gameRoom) {
      try {
        await this.gameRoom.leave();
        console.log(`Left game room: ${this.gameRoom.id}`);
      } catch (e) {
        console.error('Error while leaving game room:', e);
      } finally {
        this.gameRoom = null;
      }
    }
  }

  /**
   * Возвращает текущий экземпляр игровой комнаты.
   * @returns {colyseus.Room | null}
   */
  getGameRoom() {
    return this.gameRoom;
  }

  /**
   * Подключается к лобби-комнате для получения списка всех комнат.
   */
  async connect() {
    try {
      // "lobby" - это стандартное имя для комнаты, где отслеживаются другие комнаты
      this.lobby = await this.client.joinOrCreate('lobby');
      console.log('Successfully connected to Colyseus lobby');
    } catch (e) {
      console.error('Failed to connect to Colyseus lobby:', e);
      // Здесь можно добавить логику обработки ошибок, например, показать уведомление
    }
  }

  /**
   * Подписывает колбэк на первоначальный список комнат и на их добавление/удаление.
   * @param {function(Array)} onRoomsUpdate - Колбэк, вызываемый с полным списком комнат.
   * @param {function(Object)} onRoomAdded - Колбэк при добавлении комнаты.
   * @param {function(Object)} onRoomUpdated - Колбэк при обновлении комнаты.
   * @param {function(string)} onRoomRemoved - Колбэк при удалении комнаты.
   * @returns {function()} - Функция для отписки от всех событий.
   */
  onRoomsChange(onRoomsUpdate, onRoomAdded, onRoomUpdated, onRoomRemoved) {
    if (!this.lobby) {
      console.warn('Not connected to lobby yet.');
      return () => {}; // Возвращаем пустую функцию отписки
    }

    const handleRooms = (rooms) => onRoomsUpdate(rooms);
    const handleAdd = (room) => onRoomAdded(room);
    const handleUpdate = (room) => onRoomUpdated(room);
    const handleRemove = (roomId) => onRoomRemoved(roomId);

    this.lobby.onMessage('rooms', handleRooms);
    this.lobby.onMessage('+', handleAdd);
    this.lobby.onMessage('~', handleUpdate);
    this.lobby.onMessage('-', handleRemove);

    // Возвращаем пустую функцию - отписка не нужна, т.к. disconnect() сам покинет комнату
    // В Colyseus Room нет метода removeListener
    return () => {
      // Cleanup handled by disconnect()
    };
  }

  /**
   * Отключается от лобби.
   */
  disconnect() {
    if (this.lobby) {
      this.lobby.leave();
      this.lobby = null;
      console.log('Disconnected from Colyseus lobby');
    }
  }
}

// Экспортируем единственный экземпляр сервиса (синглтон)
export const colyseusService = new ColyseusService();
