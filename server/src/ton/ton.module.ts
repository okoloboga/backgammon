import { Module } from '@nestjs/common';
import { TonService } from './ton.service';
import { TonController } from './ton.controller';

@Module({
  controllers: [TonController],
  providers: [TonService],
  exports: [TonService],
})
export class TonModule {}
