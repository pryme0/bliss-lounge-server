import { Module } from '@nestjs/common';
import { PaymentsModule } from 'src/utils';
import { TransactionController } from './transactions.controller';
import { TransactionService } from './transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { Transaction } from './entities/transaction.entity';

@Module({
  imports: [PaymentsModule, TypeOrmModule.forFeature([Order, Transaction])],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionsModule {}
