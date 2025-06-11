import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { Admin } from 'src/admin/entities/admin.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { Recipe } from 'src/recipe/entities/recipe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, Admin, Recipe, MenuItem])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
