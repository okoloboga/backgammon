import { Room, Client, matchMaker } from '@colyseus/core';
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
  private lobbySubscription?: (payload: string) => void;

  onCreate(_options: any) {
    this.setState(new LobbyState());

    this.lobbySubscription = (payload: string) => {
      try {
        const { action, roomInfo } = JSON.parse(payload);
        if (!action || !roomInfo) return;
        if (action === 'add') {
          this.addRoom(roomInfo);
        } else if (action === 'update') {
          this.updateRoom(roomInfo.roomId, roomInfo);
        } else if (action === 'remove') {
          const roomIdToRemove =
            typeof roomInfo === 'string' ? roomInfo : roomInfo.roomId;
          this.removeRoom(roomIdToRemove);
        }
        this.broadcastRoomsUpdate();
      } catch (error) {
        console.error('[LobbyRoom] Failed to process lobby update:', error);
      }
    };
    void this.presence.subscribe('lobby_updates', this.lobbySubscription);
  }
  onDispose() {
    if (this.lobbySubscription) {
      this.presence.unsubscribe('lobby_updates', this.lobbySubscription);
      this.lobbySubscription = undefined;
    }
  }

  async onJoin(client: Client, _options: unknown) {
    console.log(`Client ${client.sessionId} joined lobby`);

    // Query matchMaker for all available rooms and update the lobby state
    const rooms = await matchMaker.query({ name: 'backgammon', locked: false });

    const roomIdsInState = new Set(this.state.rooms.keys());

    rooms.forEach((room) => {
      if (room.metadata) {
        const roomState = this.state.rooms.get(room.roomId);
        if (roomState) {
          // Update existing room
          Object.assign(roomState, room.metadata);
          roomState.playersCount = room.clients;
        } else {
          // Add new room
          const roomInfoSchema = new RoomInfo();
          Object.assign(roomInfoSchema, room.metadata);
          roomInfoSchema.playersCount = room.clients;
          this.state.rooms.set(room.roomId, roomInfoSchema);
        }
        roomIdsInState.delete(room.roomId);
      }
    });

    // Remove rooms that are no longer available
    roomIdsInState.forEach((roomId) => {
      this.state.rooms.delete(roomId);
    });

    console.log(
      `[LobbyRoom] onJoin: Refreshed room list. Count=${this.state.rooms.size}`,
    );

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
    if (!roomId) {
      console.error('[LobbyRoom] Attempted to remove room with undefined roomId');
      return;
    }
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
