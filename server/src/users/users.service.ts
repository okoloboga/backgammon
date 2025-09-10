import { Injectable } from '@nestjs/common';

export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  avatar?: string;
  balance: number;
  games: number;
  wins: number;
  loses: number;
  winrate: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  private users: Map<string, User> = new Map();

  createUser(walletAddress: string, username?: string, avatar?: string): User {
    const user: User = {
      id: this.generateId(),
      walletAddress,
      username,
      avatar,
      balance: 0,
      games: 0,
      wins: 0,
      loses: 0,
      winrate: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  getUserById(id: string): User | null {
    return this.users.get(id) || null;
  }

  getUserByWalletAddress(walletAddress: string): User | null {
    for (const user of this.users.values()) {
      if (user.walletAddress === walletAddress) {
        return user;
      }
    }
    return null;
  }

  updateUserBalance(id: string, newBalance: number): User | null {
    const user = this.users.get(id);
    if (!user) return null;

    user.balance = newBalance;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return user;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  updateUserStats(id: string, won: boolean): User | null {
    const user = this.users.get(id);
    if (!user) return null;

    user.games += 1;
    if (won) {
      user.wins += 1;
    } else {
      user.loses += 1;
    }
    user.winrate = user.games > 0 ? user.wins / user.games : 0;
    user.updatedAt = new Date();

    this.users.set(id, user);
    return user;
  }

  updateUserProfile(id: string, username?: string, avatar?: string): User | null {
    const user = this.users.get(id);
    if (!user) return null;

    if (username !== undefined) user.username = username;
    if (avatar !== undefined) user.avatar = avatar;
    user.updatedAt = new Date();

    this.users.set(id, user);
    return user;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
