import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { LobbyService } from './services/lobby.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  providers: [GameService, LobbyService],
  controllers: [GameController],
  exports: [GameService, LobbyService],
})
export class GameModule {
  constructor() {
    console.log('GameModule loaded');
  }
}
