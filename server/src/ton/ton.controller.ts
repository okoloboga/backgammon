import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TonService } from './ton.service';

export class VerifyTransactionDto {
  txHash: string;
  expectedAmount: number;
  expectedTo: string;
}

@Controller('ton')
export class TonController {
  constructor(private readonly tonService: TonService) {}

  @Get('network')
  getNetworkInfo() {
    return this.tonService.getNetworkInfo();
  }

  @Get('wallet/:address/balance')
  async getWalletBalance(@Param('address') address: string) {
    try {
      const balance = await this.tonService.getWalletBalance(address);
      return { address, balance };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('wallet/:address/history')
  async getTransactionHistory(
    @Param('address') address: string,
    @Body() body: { limit?: number }
  ) {
    try {
      const limit = body.limit || 10;
      const history = await this.tonService.getTransactionHistory(address, limit);
      return { address, history };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Post('verify')
  async verifyTransaction(@Body() body: VerifyTransactionDto) {
    try {
      const verified = await this.tonService.verifyTransaction(
        body.txHash,
        body.expectedAmount,
        body.expectedTo
      );
      return { verified, txHash: body.txHash };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Post('wallet/create')
  async createWallet() {
    try {
      const wallet = await this.tonService.createWallet();
      return wallet;
    } catch (error) {
      return { error: error.message };
    }
  }
} 