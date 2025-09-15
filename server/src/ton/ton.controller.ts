import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { TonService } from './ton.service';

export class VerifyTransactionDto {
  txHash: string;
  expectedAmount: number;
  expectedTo: string;
}

@ApiTags('TON')
@Controller('ton')
export class TonController {
  constructor(private readonly tonService: TonService) {}

  @Get('network')
  @ApiOperation({ 
    summary: 'Get TON network information',
    description: 'Returns information about connected TON network'
  })
  @ApiResponse({
    status: 200,
    description: 'Network information',
    schema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          description: 'Network name',
          example: 'mainnet'
        },
        endpoint: {
          type: 'string',
          description: 'Network endpoint',
          example: 'https://toncenter.com/api/v2/jsonRPC'
        }
      }
    }
  })
  getNetworkInfo() {
    return this.tonService.getNetworkInfo();
  }

  @Get('wallet/:address/balance')
  @ApiOperation({ 
    summary: 'Get TON wallet balance',
    description: 'Returns current balance of TON wallet'
  })
  @ApiParam({
    name: 'address',
    description: 'TON wallet address',
    example: 'EQD0vdSA_NedR9uvnh85V0S_3Bd3XJgq8Y5k-1CLq8k5tOPi'
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance',
    schema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Wallet address'
        },
        balance: {
          type: 'number',
          description: 'Balance in TON',
          example: 10.5
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Error getting balance',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'Error description'
        }
      }
    }
  })
  async getWalletBalance(@Param('address') address: string) {
    try {
      const balance = await this.tonService.getWalletBalance(address);
      return { address, balance };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'unknown error',
      };
    }
  }

  @Get('wallet/:address/history')
  @ApiOperation({ 
    summary: 'Get TON wallet transaction history',
    description: 'Returns transaction history of TON wallet'
  })
  @ApiParam({
    name: 'address',
    description: 'TON wallet address',
    example: 'EQD0vdSA_NedR9uvnh85V0S_3Bd3XJgq8Y5k-1CLq8k5tOPi'
  })
  @ApiBody({
    description: 'Request parameters',
    schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of transactions',
          example: 10,
          default: 10
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history',
    schema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Wallet address'
        },
        history: {
          type: 'array',
          description: 'List of transactions',
          items: {
            type: 'object',
            properties: {
              hash: { type: 'string' },
              amount: { type: 'number' },
              from: { type: 'string' },
              to: { type: 'string' },
              timestamp: { type: 'number' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Error getting history',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'Error description'
        }
      }
    }
  })
  getTransactionHistory(
    @Param('address') address: string,
    @Body() body: { limit?: number },
  ) {
    try {
      const limit = body.limit || 10;
      const history = this.tonService.getTransactionHistory(address, limit);
      return { address, history };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'unknown error',
      };
    }
  }

  @Post('verify')
  @ApiOperation({ 
    summary: 'Verify TON transaction',
    description: 'Verifies TON transaction on blockchain'
  })
  @ApiBody({
    description: 'Transaction verification data',
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
        },
        txHash: {
          type: 'string',
          description: 'Hash of verified transaction'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Error verifying transaction',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'Error description'
        }
      }
    }
  })
  verifyTransaction(@Body() body: VerifyTransactionDto) {
    try {
      const verified = this.tonService.verifyTransaction(
        body.txHash,
        body.expectedAmount,
        body.expectedTo,
      );
      return { verified, txHash: body.txHash };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'unknown error',
      };
    }
  }

  @Post('wallet/create')
  @ApiOperation({ 
    summary: 'Create new TON wallet',
    description: 'Creates a new TON wallet (for demonstration)'
  })
  @ApiResponse({
    status: 201,
    description: 'Wallet successfully created',
    schema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Address of new wallet',
          example: 'EQD0vdSA_NedR9uvnh85V0S_3Bd3XJgq8Y5k-1CLq8k5tOPi'
        },
        mnemonic: {
          type: 'array',
          description: 'Mnemonic phrase for wallet recovery',
          items: {
            type: 'string'
          },
          example: ['word1', 'word2', 'word3', '...']
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Error creating wallet',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'Error description'
        }
      }
    }
  })
  createWallet() {
    try {
      const wallet = this.tonService.createWallet();
      return wallet;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'unknown error',
      };
    }
  }
}