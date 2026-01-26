import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { LobbyService } from './services/lobby.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { TonModule } from '../ton/ton.module';

@Module({
  imports: [UsersModule, AuthModule, TonModule],
  providers: [GameService, LobbyService],
  controllers: [GameController],
  exports: [GameService, LobbyService],
})
export class GameModule {
  constructor() {
    console.log('GameModule loaded');
  }
}
