import * as colyseus from 'colyseus.js';

// Адрес вашего игрового сервера Colyseus
// В идеале, это должно быть в .env файле
const COLYSEUS_ENDPOINT = import.meta.env.MODE === 'production' 
  ? 'wss://backgammon.ruble.website' 
  : 'ws://localhost:2567';

class ColyseusService {
  constructor() {
    this.client = new colyseus.Client(COLYSEUS_ENDPOINT);
    this.lobby = null;
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

    // Возвращаем функцию для очистки подписок
    return () => {
      this.lobby.removeListener('rooms', handleRooms);
      this.lobby.removeListener('+', handleAdd);
      this.lobby.removeListener('~', handleUpdate);
      this.lobby.removeListener('-', handleRemove);
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
