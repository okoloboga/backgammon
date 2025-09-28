import { Injectable } from '@nestjs/common';
import { Server, matchMaker } from '@colyseus/core';
import { RoomInfo } from '../types';

@Injectable()
export class LobbyService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  // Уведомляет все лобби-комнаты об изменениях
  async notifyLobby(action: 'add' | 'update' | 'remove', roomInfo: RoomInfo) {
    if (!this.server) {
      console.warn('Server not set in LobbyService');
      return;
    }

    try {
      // Получаем все лобби-комнаты
      const lobbyRooms = await matchMaker.query({ name: 'lobby' });

      for (const lobbyRoomData of lobbyRooms) {
        const lobbyRoom = await matchMaker.getRoomById(lobbyRoomData.roomId);
        if (lobbyRoom) {
          if (action === 'add') {
            lobbyRoom.broadcast('+', roomInfo);
          } else if (action === 'update') {
            lobbyRoom.broadcast('~', roomInfo);
          } else if (action === 'remove') {
            lobbyRoom.broadcast('-', roomInfo.roomId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to notify lobby:', error);
    }
  }
}