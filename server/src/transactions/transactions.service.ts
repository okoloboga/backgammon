import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TonService } from '../ton/ton.service';

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'GAME_BET' | 'GAME_WIN';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionDto {
  userId: string;
  type: Transaction['type'];
  amount: number;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  private transactions: Map<string, Transaction> = new Map();

  constructor(
    private readonly usersService: UsersService,
    private readonly tonService: TonService,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.generateId(),
      userId: createTransactionDto.userId,
      type: createTransactionDto.type,
      amount: createTransactionDto.amount,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);
    
    // Если это депозит, обрабатываем его
    if (transaction.type === 'DEPOSIT') {
      await this.processDeposit(transaction);
    }

    return transaction;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.transactions.get(id) || null;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      tx => tx.userId === userId
    );
  }

  async updateTransactionStatus(id: string, status: Transaction['status'], txHash?: string): Promise<Transaction | null> {
    const transaction = this.transactions.get(id);
    if (!transaction) return null;

    transaction.status = status;
    if (txHash) transaction.txHash = txHash;
    transaction.updatedAt = new Date();
    
    this.transactions.set(id, transaction);
    return transaction;
  }

  async processDeposit(transaction: Transaction): Promise<void> {
    try {
      this.logger.log(`Processing deposit transaction ${transaction.id} for user ${transaction.userId}`);
      
      // Здесь будет логика для проверки TON транзакции
      // Пока что просто симулируем успешную обработку
      await this.updateTransactionStatus(transaction.id, 'COMPLETED');
      
      // Обновляем баланс пользователя
      const user = await this.usersService.getUserById(transaction.userId);
      if (user) {
        await this.usersService.updateUserBalance(
          user.id, 
          user.balance + transaction.amount
        );
      }
      
      this.logger.log(`Deposit transaction ${transaction.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Error processing deposit transaction ${transaction.id}:`, error);
      await this.updateTransactionStatus(transaction.id, 'FAILED');
    }
  }

  async verifyTonTransaction(txHash: string, expectedAmount: number, expectedTo: string): Promise<boolean> {
    try {
      this.logger.log(`Verifying TON transaction: ${txHash}`);
      
      // Используем TON сервис для проверки транзакции
      const verified = await this.tonService.verifyTransaction(txHash, expectedAmount, expectedTo);
      
      if (verified) {
        this.logger.log(`TON transaction ${txHash} verified successfully`);
      } else {
        this.logger.warn(`TON transaction ${txHash} verification failed`);
      }
      
      return verified;
    } catch (error) {
      this.logger.error(`Error verifying TON transaction ${txHash}:`, error);
      return false;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
} 