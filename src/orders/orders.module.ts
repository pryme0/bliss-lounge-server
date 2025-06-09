import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { OrderItem } from './entities/order-item.entity';

@Module({
  imports: [
    TransactionsModule,
    TypeOrmModule.forFeature([Order, MenuItem, Customer, OrderItem]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
