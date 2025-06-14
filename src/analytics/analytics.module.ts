import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { Admin } from 'src/admin/entities/admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, MenuItem, Customer, OrderItem, Inventory,Admin]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
