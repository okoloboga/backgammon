import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [AppConfigModule, UsersModule, TransactionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
