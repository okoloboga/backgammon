import { Injectable } from '@nestjs/common';
import { Server, matchMaker } from '@colyseus/core';

@Injectable()
export class LobbyService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  // Уведомляет все лобби-комнаты об изменениях
  async notifyLobby(action: 'add' | 'update' | 'remove', roomInfo: any) {
    if (!this.server) {
      console.warn('Server not set in LobbyService');
      return;
    }

    try {
      // Получаем все лобби-комнаты
      const lobbyRooms = await matchMaker.query({ name: 'lobby' });
      
      lobbyRooms.forEach((lobbyRoom) => {
        if (action === 'add') {
          lobbyRoom.send('+', roomInfo);
        } else if (action === 'update') {
          lobbyRoom.send('~', roomInfo);
        } else if (action === 'remove') {
          lobbyRoom.send('-', roomInfo.roomId || roomInfo);
        }
      });
    } catch (error) {
      console.error('Failed to notify lobby:', error);
    }
  }
}