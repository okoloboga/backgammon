import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { TransactionsService, Transaction, CreateTransactionDto } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    return this.transactionsService.createTransaction(createTransactionDto);
  }

  @Get()
  async getAllTransactions(): Promise<Transaction[]> {
    // В реальном приложении здесь должна быть пагинация и фильтрация
    return [];
  }

  @Get(':id')
  async getTransactionById(@Param('id') id: string): Promise<Transaction | null> {
    return this.transactionsService.getTransactionById(id);
  }

  @Get('user/:userId')
  async getUserTransactions(@Param('userId') userId: string): Promise<Transaction[]> {
    return this.transactionsService.getUserTransactions(userId);
  }

  @Put(':id/status')
  async updateTransactionStatus(
    @Param('id') id: string,
    @Body() body: { status: Transaction['status']; txHash?: string }
  ): Promise<Transaction | null> {
    return this.transactionsService.updateTransactionStatus(id, body.status, body.txHash);
  }

  @Post('verify-ton')
  async verifyTonTransaction(
    @Body() body: { txHash: string; expectedAmount: number; expectedTo: string }
  ): Promise<{ verified: boolean }> {
    const verified = await this.transactionsService.verifyTonTransaction(
      body.txHash,
      body.expectedAmount,
      body.expectedTo
    );
    return { verified };
  }
} 