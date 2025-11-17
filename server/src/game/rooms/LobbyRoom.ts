import { Room, Client } from '@colyseus/core';
import { Schema, MapSchema, type } from '@colyseus/schema';
import { RoomInfo as RoomInfoInterface } from '../types';

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
    this.onMessage('+', (client, roomInfo: RoomInfoInterface) => {
      this.addRoom(roomInfo);
      this.broadcastRoomsUpdate();
    });

    this.onMessage('~', (client, roomInfo: RoomInfoInterface) => {
      this.updateRoom(roomInfo.roomId, roomInfo);
      this.broadcastRoomsUpdate();
    });

    this.onMessage('-', (client, roomId: string) => {
      this.removeRoom(roomId);
      this.broadcastRoomsUpdate();
    });
  }

  onJoin(client: Client, _options: unknown) {
    console.log(`Client ${client.sessionId} joined lobby`);

    // Отправляем текущий список комнат
    this.sendRoomsList(client);
  }

  onLeave(client: Client, _consented: boolean) {
    console.log(`Client ${client.sessionId} left lobby`);
  }

  // Метод для добавления комнаты в лобби
  addRoom(roomInfo: RoomInfoInterface) {
    const roomInfoSchema = new RoomInfo();
    Object.assign(roomInfoSchema, roomInfo);
    this.state.rooms.set(roomInfo.roomId, roomInfoSchema);
    console.log(
      `[LobbyRoom] Room ${roomInfo.roomId} added. Total rooms: ${this.state.rooms.size}`,
    );
  }

  // Метод для удаления комнаты из лобби
  removeRoom(roomId: string) {
    this.state.rooms.delete(roomId);
    console.log(`Room ${roomId} removed from lobby`);
  }

  // Метод для обновления информации о комнате
  updateRoom(roomId: string, updates: Partial<RoomInfoInterface>) {
    const room = this.state.rooms.get(roomId);
    if (room) {
      Object.assign(room, updates);
      console.log(
        `[LobbyRoom] Room ${roomId} updated -> players=${room.playersCount}, status=${room.status}`,
      );
    }
  }

  // Отправляет список комнат клиенту
  private sendRoomsList(client: Client) {
    const roomsArray = Array.from(this.state.rooms.values());
    console.log(
      `[LobbyRoom] Sending rooms list to ${client.sessionId}. Count=${roomsArray.length}`,
    );
    client.send('rooms', roomsArray);
  }

  // Отправляет обновление всем клиентам в лобби
  private broadcastRoomsUpdate() {
    const roomsArray = Array.from(this.state.rooms.values());
    console.log(
      `[LobbyRoom] Broadcasting rooms update. Count=${roomsArray.length}`,
    );
    this.broadcast('rooms', roomsArray);
  }
}
