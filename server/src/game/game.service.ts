import { Injectable } from '@nestjs/common';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { BackgammonRoom } from './rooms/BackgammonRoom';
import * as http from 'http';

@Injectable()
export class GameService {
  public server: Server;

  initialize(httpServer: http.Server) {
    this.server = new Server({
      transport: new WebSocketTransport({ server: httpServer }),
    });

    // Define the game room
    this.server.define('backgammon', BackgammonRoom);

    console.log('Colyseus server initialized');
  }
}
