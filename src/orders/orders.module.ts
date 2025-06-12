import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { OrderItem } from './entities/order-item.entity';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { RecipeModule } from 'src/recipe/recipe.module';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { InventoryModule } from 'src/inventory/inventory.module';
import { MenuItemModule } from 'src/menu-item/menu-item.module';

@Module({
  imports: [
    MenuItemModule,
    InventoryModule,
    RecipeModule,
    TransactionsModule,
    TypeOrmModule.forFeature([
      Order,
      MenuItem,
      Customer,
      OrderItem,
      Inventory,
      Recipe,
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
