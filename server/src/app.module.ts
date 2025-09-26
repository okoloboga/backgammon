import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'backgammon',
      entities: [User],
      synchronize: true, // В продакшене должно быть false
    }),
    UsersModule,
    AuthModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
