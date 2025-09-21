import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(walletAddress: string, username?: string, avatar?: string): Promise<User> {
    const user = this.userRepository.create({
      walletAddress,
      username,
      avatar,
      games: 0,
      wins: 0,
      loses: 0,
      winrate: 0,
      currentStreak: 0,
      bestStreak: 0,
      level: 1,
      experience: 0,
      friends: [],
      achievements: [],
    });

    return await this.userRepository.save(user);
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { walletAddress } });
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async updateUserStats(id: string, won: boolean): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;

    user.games += 1;
    if (won) {
      user.wins += 1;
      user.currentStreak += 1;
      if (user.currentStreak > user.bestStreak) {
        user.bestStreak = user.currentStreak;
      }
      user.experience += 100;
    } else {
      user.loses += 1;
      user.currentStreak = 0;
      user.experience += 25;
    }

    user.winrate = user.games > 0 ? user.wins / user.games : 0;

    const newLevel = Math.floor(user.experience / 1000) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
    }

    return await this.userRepository.save(user);
  }

  async updateUserProfile(
    id: string,
    username?: string,
    avatar?: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;

    if (username !== undefined) user.username = username;
    if (avatar !== undefined) user.avatar = avatar;

    return await this.userRepository.save(user);
  }

  async addFriend(userId: string, friendWalletAddress: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    if (!user.friends.includes(friendWalletAddress)) {
      user.friends.push(friendWalletAddress);
      return await this.userRepository.save(user);
    }
    return user;
  }

  async addAchievement(userId: string, achievement: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return null;

    if (!user.achievements.includes(achievement)) {
      user.achievements.push(achievement);
      return await this.userRepository.save(user);
    }
    return user;
  }
}