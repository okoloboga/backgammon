import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [AppConfigModule, UsersModule, AuthModule, GameModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
