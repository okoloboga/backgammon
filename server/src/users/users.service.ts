import { Injectable } from '@nestjs/common';

export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  avatar?: string;
  // Игровая статистика (НЕ балансы!)
  games: number;
  wins: number;
  loses: number;
  winrate: number;
  currentStreak: number;
  bestStreak: number;
  level: number;
  experience: number;
  // Социальные данные
  friends: string[];
  achievements: string[];
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
      // Игровая статистика
      games: 0,
      wins: 0,
      loses: 0,
      winrate: 0,
      currentStreak: 0,
      bestStreak: 0,
      level: 1,
      experience: 0,
      // Социальные данные
      friends: [],
      achievements: [],
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

  // Удаляем метод updateUserBalance - балансы теперь в смарт-контракте

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  updateUserStats(id: string, won: boolean): User | null {
    const user = this.users.get(id);
    if (!user) return null;

    user.games += 1;
    if (won) {
      user.wins += 1;
      user.currentStreak += 1;
      if (user.currentStreak > user.bestStreak) {
        user.bestStreak = user.currentStreak;
      }
      // Даем опыт за победу
      user.experience += 100;
    } else {
      user.loses += 1;
      user.currentStreak = 0; // Сбрасываем серию
      // Даем опыт за поражение
      user.experience += 25;
    }
    
    user.winrate = user.games > 0 ? user.wins / user.games : 0;
    
    // Проверяем повышение уровня
    const newLevel = Math.floor(user.experience / 1000) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
      // Можно добавить уведомление о повышении уровня
    }
    
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

  // Социальные функции
  addFriend(userId: string, friendWalletAddress: string): User | null {
    const user = this.users.get(userId);
    if (!user) return null;

    if (!user.friends.includes(friendWalletAddress)) {
      user.friends.push(friendWalletAddress);
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
    return user;
  }

  addAchievement(userId: string, achievement: string): User | null {
    const user = this.users.get(userId);
    if (!user) return null;

    if (!user.achievements.includes(achievement)) {
      user.achievements.push(achievement);
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
    return user;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
