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
      // For 'remove', we only need the roomId.
      const payload =
        action === 'remove'
          ? JSON.stringify({ action, roomInfo: roomInfo.roomId })
          : JSON.stringify({ action, roomInfo });

      console.log(
        `[LobbyService] Publishing lobby update: action=${action} room=${roomInfo.roomId} players=${roomInfo.playersCount} status=${roomInfo.status}`,
      );
      await matchMaker.presence.publish('lobby_updates', payload);
    } catch (error) {
      console.error('Failed to notify lobby:', error);
    }
  }
}