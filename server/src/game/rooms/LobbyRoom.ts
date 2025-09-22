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

    // Обработка сообщений от LobbyService
    this.onMessage('+', (client, roomInfo) => {
      this.addRoom(roomInfo);
      this.broadcastRoomsUpdate();
    });

    this.onMessage('~', (client, roomInfo) => {
      this.updateRoom(roomInfo.roomId, roomInfo);
      this.broadcastRoomsUpdate();
    });

    this.onMessage('-', (client, roomId) => {
      this.removeRoom(roomId);
      this.broadcastRoomsUpdate();
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
  addRoom(roomInfo: any) {
    const roomInfoSchema = new RoomInfo();
    roomInfoSchema.roomId = roomInfo.roomId;
    roomInfoSchema.roomName = roomInfo.roomName;
    roomInfoSchema.playersCount = roomInfo.playersCount;
    roomInfoSchema.maxPlayers = roomInfo.maxPlayers;
    roomInfoSchema.status = roomInfo.status;
    roomInfoSchema.createdBy = roomInfo.createdBy;
    roomInfoSchema.betAmount = roomInfo.betAmount;
    roomInfoSchema.currency = roomInfo.currency;
    roomInfoSchema.createdAt = roomInfo.createdAt;
    
    this.state.rooms.set(roomInfo.roomId, roomInfoSchema);
    console.log(`Room ${roomInfo.roomId} added to lobby`);
  }

  // Метод для удаления комнаты из лобби
  removeRoom(roomId: string) {
    this.state.rooms.delete(roomId);
    console.log(`Room ${roomId} removed from lobby`);
  }

  // Метод для обновления информации о комнате
  updateRoom(roomId: string, updates: any) {
    const room = this.state.rooms.get(roomId);
    if (room) {
      if (updates.roomName !== undefined) room.roomName = updates.roomName;
      if (updates.playersCount !== undefined) room.playersCount = updates.playersCount;
      if (updates.maxPlayers !== undefined) room.maxPlayers = updates.maxPlayers;
      if (updates.status !== undefined) room.status = updates.status;
      if (updates.createdBy !== undefined) room.createdBy = updates.createdBy;
      if (updates.betAmount !== undefined) room.betAmount = updates.betAmount;
      if (updates.currency !== undefined) room.currency = updates.currency;
      if (updates.createdAt !== undefined) room.createdAt = updates.createdAt;
      
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