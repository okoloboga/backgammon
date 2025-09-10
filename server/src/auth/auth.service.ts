import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, User } from '../users/users.service';

export interface AuthPayload {
  walletAddress: string;
  sub: string; // user ID
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(walletAddress: string): Promise<User | null> {
    this.logger.log(`Validating user with wallet: ${walletAddress}`);
    
    // Ищем пользователя по адресу кошелька
    const user = this.usersService.getUserByWalletAddress(walletAddress);
    
    if (user) {
      this.logger.log(`User found: ${user.id}`);
      return user;
    }

    this.logger.log(`User not found, will create new user`);
    return null;
  }

  async login(walletAddress: string, username?: string, avatar?: string): Promise<AuthResponse> {
    this.logger.log(`Login attempt for wallet: ${walletAddress}`);

    // Проверяем, есть ли пользователь
    let user = this.usersService.getUserByWalletAddress(walletAddress);

    if (!user) {
      // Создаем нового пользователя
      this.logger.log(`Creating new user for wallet: ${walletAddress}`);
      user = this.usersService.createUser(walletAddress, username, avatar);
    } else {
      // Обновляем профиль существующего пользователя, если переданы данные
      if (username !== undefined || avatar !== undefined) {
        const updatedUser = this.usersService.updateUserProfile(user.id, username, avatar);
        if (updatedUser) {
          user = updatedUser;
        }
      }
    }

    // Проверяем, что пользователь создан/найден
    if (!user) {
      throw new Error('Failed to create or find user');
    }

    // Создаем JWT токен
    const payload: AuthPayload = {
      walletAddress: user.walletAddress,
      sub: user.id,
    };

    const access_token = this.jwtService.sign(payload);

    this.logger.log(`User ${user.id} logged in successfully`);

    return {
      access_token,
      user,
    };
  }

  async validateJwtPayload(payload: AuthPayload): Promise<User | null> {
    return this.usersService.getUserById(payload.sub);
  }
}