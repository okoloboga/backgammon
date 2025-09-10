import { Injectable } from '@nestjs/common';

export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  private users: Map<string, User> = new Map();

  async createUser(walletAddress: string, username?: string): Promise<User> {
    const user: User = {
      id: this.generateId(),
      walletAddress,
      username,
      balance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.walletAddress === walletAddress) {
        return user;
      }
    }
    return null;
  }

  async updateUserBalance(id: string, newBalance: number): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    user.balance = newBalance;
    user.updatedAt = new Date();
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
} 