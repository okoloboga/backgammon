import { Module } from '@nestjs/common';
import { TonService } from './ton.service';
import { TonController } from './ton.controller';
import { EscrowService } from './escrow.service';

@Module({
  controllers: [TonController],
  providers: [TonService, EscrowService],
  exports: [TonService, EscrowService],
})
export class TonModule {}
