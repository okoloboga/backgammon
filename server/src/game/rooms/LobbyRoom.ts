import { Room, Client } from '@colyseus/core';
import { Schema, MapSchema, type } from '@colyseus/schema';

export class RoomInfo extends Schema {
  @type('string') roomId: string;
  @type('string') roomName: string;
  @type('number') playersCount: number;
  @type('number') maxPlayers: number;
  @type('string') status: string; // 'waiting', 'playing', 'finished'
  @type('string') createdBy: string; // wallet address
  @type('number') betAmount: number;
  @type('string') currency: string; // 'TON', 'RUBLE'
  @type('number') createdAt: number;
}

export class LobbyState extends Schema {
  @type({ map: RoomInfo }) rooms = new MapSchema<RoomInfo>();
}

export class LobbyRoom extends Room<LobbyState> {
  onCreate(_options: any) {
    this.setState(new LobbyState());
    
    // Отправляем текущий список комнат новому клиенту
    this.onMessage('getRooms', (client) => {
      this.sendRoomsList(client);
    });
  }

  onJoin(client: Client, _options: any) {
    console.log(`Client ${client.sessionId} joined lobby`);
    
    // Отправляем текущий список комнат
    this.sendRoomsList(client);
  }

  onLeave(client: Client, _consented: boolean) {
    console.log(`Client ${client.sessionId} left lobby`);
  }

  // Метод для добавления комнаты в лобби
  addRoom(roomInfo: RoomInfo) {
    this.state.rooms.set(roomInfo.roomId, roomInfo);
    console.log(`Room ${roomInfo.roomId} added to lobby`);
  }

  // Метод для удаления комнаты из лобби
  removeRoom(roomId: string) {
    this.state.rooms.delete(roomId);
    console.log(`Room ${roomId} removed from lobby`);
  }

  // Метод для обновления информации о комнате
  updateRoom(roomId: string, updates: Partial<RoomInfo>) {
    const room = this.state.rooms.get(roomId);
    if (room) {
      Object.assign(room, updates);
      console.log(`Room ${roomId} updated in lobby`);
    }
  }

  // Отправляет список комнат клиенту
  private sendRoomsList(client: Client) {
    const roomsArray = Array.from(this.state.rooms.values());
    client.send('rooms', roomsArray);
  }

  // Отправляет обновление всем клиентам в лобби
  private broadcastRoomsUpdate() {
    const roomsArray = Array.from(this.state.rooms.values());
    this.broadcast('rooms', roomsArray);
  }
}