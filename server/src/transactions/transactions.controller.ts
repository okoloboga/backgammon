import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import {
  TransactionsService,
  Transaction,
  CreateTransactionDto,
} from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionsService.createTransaction(createTransactionDto);
  }

  @Get()
  getAllTransactions(): Transaction[] {
    // В реальном приложении здесь должна быть пагинация и фильтрация
    return [];
  }

  @Get(':id')
  getTransactionById(@Param('id') id: string): Transaction | null {
    return this.transactionsService.getTransactionById(id);
  }

  @Get('user/:userId')
  getUserTransactions(@Param('userId') userId: string): Transaction[] {
    return this.transactionsService.getUserTransactions(userId);
  }

  @Put(':id/status')
  updateTransactionStatus(
    @Param('id') id: string,
    @Body() body: { status: Transaction['status']; txHash?: string },
  ): Transaction | null {
    return this.transactionsService.updateTransactionStatus(
      id,
      body.status,
      body.txHash,
    );
  }

  @Post('verify-ton')
  verifyTonTransaction(
    @Body()
    body: {
      txHash: string;
      expectedAmount: number;
      expectedTo: string;
    },
  ): Promise<{ verified: boolean }> {
    return this.transactionsService.verifyTonTransaction(
      body.txHash,
      body.expectedAmount,
      body.expectedTo,
    );
  }
}
