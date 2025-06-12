import { forwardRef, Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { Admin } from 'src/admin/entities/admin.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { RecipeModule } from 'src/recipe/recipe.module';

@Module({
  imports: [
    forwardRef(() => RecipeModule),
    TypeOrmModule.forFeature([Inventory, Admin, MenuItem]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
