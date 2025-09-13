import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { GameLogService } from './transactions.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [TransactionsController],
  providers: [GameLogService],
  exports: [GameLogService],
})
export class TransactionsModule {}
