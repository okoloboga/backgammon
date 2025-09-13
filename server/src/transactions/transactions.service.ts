import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TonService } from '../ton/ton.service';

// Игровые логи (НЕ финансовые транзакции!)
export interface GameLog {
  id: string;
  userId: string;
  action: 'GAME_CREATED' | 'GAME_JOINED' | 'GAME_FINISHED' | 'ACHIEVEMENT_UNLOCKED' | 'LEVEL_UP';
  gameId?: string;
  details: Record<string, any>; // Дополнительные данные
  createdAt: Date;
}

export interface CreateGameLogDto {
  userId: string;
  action: GameLog['action'];
  gameId?: string;
  details?: Record<string, any>;
}

@Injectable()
export class GameLogService {
  private readonly logger = new Logger(GameLogService.name);
  private gameLogs: Map<string, GameLog> = new Map();

  constructor(
    private readonly usersService: UsersService,
  ) {}

  async createGameLog(
    createGameLogDto: CreateGameLogDto,
  ): Promise<GameLog> {
    const gameLog: GameLog = {
      id: this.generateId(),
      userId: createGameLogDto.userId,
      action: createGameLogDto.action,
      gameId: createGameLogDto.gameId,
      details: createGameLogDto.details || {},
      createdAt: new Date(),
    };

    this.gameLogs.set(gameLog.id, gameLog);
    this.logger.log(`Game log created: ${gameLog.action} for user ${gameLog.userId}`);

    return gameLog;
  }

  getGameLogById(id: string): GameLog | null {
    return this.gameLogs.get(id) || null;
  }

  getUserGameLogs(userId: string): GameLog[] {
    return Array.from(this.gameLogs.values()).filter(
      (log) => log.userId === userId,
    );
  }

  getGameLogsByAction(action: GameLog['action']): GameLog[] {
    return Array.from(this.gameLogs.values()).filter(
      (log) => log.action === action,
    );
  }

  // Игровые события
  async logGameCreated(userId: string, gameId: string, betAmount: number, currency: string): Promise<GameLog> {
    return this.createGameLog({
      userId,
      action: 'GAME_CREATED',
      gameId,
      details: { betAmount, currency }
    });
  }

  async logGameJoined(userId: string, gameId: string): Promise<GameLog> {
    return this.createGameLog({
      userId,
      action: 'GAME_JOINED',
      gameId
    });
  }

  async logGameFinished(userId: string, gameId: string, won: boolean, duration: number): Promise<GameLog> {
    return this.createGameLog({
      userId,
      action: 'GAME_FINISHED',
      gameId,
      details: { won, duration }
    });
  }

  async logAchievementUnlocked(userId: string, achievement: string): Promise<GameLog> {
    return this.createGameLog({
      userId,
      action: 'ACHIEVEMENT_UNLOCKED',
      details: { achievement }
    });
  }

  async logLevelUp(userId: string, newLevel: number): Promise<GameLog> {
    return this.createGameLog({
      userId,
      action: 'LEVEL_UP',
      details: { newLevel }
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
