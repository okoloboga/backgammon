import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import {
  TransactionsService,
  Transaction,
  CreateTransactionDto,
} from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/users.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create new transaction',
    description: 'Creates a new transaction for the current user'
  })
  @ApiBody({
    description: 'Transaction creation data',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['DEPOSIT', 'WITHDRAWAL', 'GAME_BET', 'GAME_WIN'],
          description: 'Transaction type',
          example: 'DEPOSIT'
        },
        amount: {
          type: 'number',
          description: 'Transaction amount in TON',
          example: 5.0
        }
      },
      required: ['type', 'amount']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL', 'GAME_BET', 'GAME_WIN'] },
        amount: { type: 'number' },
        status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
        txHash: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() currentUser: User,
  ): Promise<Transaction> {
    // Set userId from current user
    createTransactionDto.userId = currentUser.id;
    return this.transactionsService.createTransaction(createTransactionDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all transactions',
    description: 'Returns list of all transactions (in real app should have pagination)'
  })
  @ApiResponse({
    status: 200,
    description: 'List of transactions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL', 'GAME_BET', 'GAME_WIN'] },
          amount: { type: 'number' },
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
          txHash: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  getAllTransactions(): Transaction[] {
    // In real app should have pagination and filtering
    return [];
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get transaction by ID',
    description: 'Returns transaction data by unique identifier'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique transaction identifier',
    example: 'tx_abc123def'
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction data',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL', 'GAME_BET', 'GAME_WIN'] },
        amount: { type: 'number' },
        status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
        txHash: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  getTransactionById(@Param('id') id: string): Transaction | null {
    return this.transactionsService.getTransactionById(id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get user transactions',
    description: 'Returns list of transactions for specific user (only own transactions)'
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'abc123def'
  })
  @ApiResponse({
    status: 200,
    description: 'List of user transactions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL', 'GAME_BET', 'GAME_WIN'] },
          amount: { type: 'number' },
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
          txHash: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'No permission to view this user transactions' })
  getUserTransactions(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: User,
  ): Transaction[] {
    // Check that user can only view their own transactions
    if (currentUser.id !== userId) {
      throw new Error('Unauthorized: Can only view your own transactions');
    }
    return this.transactionsService.getUserTransactions(userId);
  }

  @Put(':id/status')
  @ApiOperation({ 
    summary: 'Update transaction status',
    description: 'Updates transaction status (usually used by system)'
  })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    example: 'tx_abc123def'
  })
  @ApiBody({
    description: 'New transaction status',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'COMPLETED', 'FAILED'],
          description: 'New transaction status',
          example: 'COMPLETED'
        },
        txHash: {
          type: 'string',
          description: 'TON transaction hash (optional)',
          example: '0x1234567890abcdef...'
        }
      },
      required: ['status']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction status successfully updated'
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Verify TON transaction',
    description: 'Verifies TON transaction on blockchain'
  })
  @ApiBody({
    description: 'TON transaction verification data',
    schema: {
      type: 'object',
      properties: {
        txHash: {
          type: 'string',
          description: 'TON transaction hash',
          example: '0x1234567890abcdef...'
        },
        expectedAmount: {
          type: 'number',
          description: 'Expected transaction amount in TON',
          example: 5.0
        },
        expectedTo: {
          type: 'string',
          description: 'Expected recipient address',
          example: 'EQD0vdSA_NedR9uvnh85V0S_3Bd3XJgq8Y5k-1CLq8k5tOPi'
        }
      },
      required: ['txHash', 'expectedAmount', 'expectedTo']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction verification result',
    schema: {
      type: 'object',
      properties: {
        verified: {
          type: 'boolean',
          description: 'Whether transaction is verified',
          example: true
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async verifyTonTransaction(
    @Body()
    body: {
      txHash: string;
      expectedAmount: number;
      expectedTo: string;
    },
  ): Promise<{ verified: boolean }> {
    const verified = await this.transactionsService.verifyTonTransaction(
      body.txHash,
      body.expectedAmount,
      body.expectedTo,
    );
    return { verified };
  }
}