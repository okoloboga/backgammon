import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { UsersModule } from '../users/users.module';
import { TonModule } from '../ton/ton.module';

@Module({
  imports: [UsersModule, TonModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
