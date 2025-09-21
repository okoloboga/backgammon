import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  walletAddress: string;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  avatar?: string;

  // Игровая статистика
  @Column({ default: 0 })
  games: number;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  loses: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  winrate: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  bestStreak: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  experience: number;

  // Социальные данные
  @Column('text', { array: true, default: '{}' })
  friends: string[];

  @Column('text', { array: true, default: '{}' })
  achievements: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}