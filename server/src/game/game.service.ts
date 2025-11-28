import { Injectable } from '@nestjs/common';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { BackgammonRoom } from './rooms/BackgammonRoom';
import { LobbyRoom } from './rooms/LobbyRoom';
import { LobbyService } from './services/lobby.service';
import * as http from 'http';

@Injectable()
export class GameService {
  public server: Server;
  private lobbyService: LobbyService;

  constructor(lobbyService: LobbyService) {
    this.lobbyService = lobbyService;
  }

  initialize(httpServer: http.Server) {
    this.server = new Server({
      transport: new WebSocketTransport({ server: httpServer }),
    });

    // Define the game room with lobby service
    this.server.define('backgammon', BackgammonRoom, {
      lobbyService: this.lobbyService,
    });

    // Define the lobby room
    this.server.define('lobby', LobbyRoom, { autoDispose: false });

    // Set server in lobby service
    this.lobbyService.setServer(this.server);

    console.log('Colyseus server initialized');
  }
}
