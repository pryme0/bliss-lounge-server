import { Module } from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { MenuItemController } from './menu-item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { SupabaseProvider } from 'src/supabase';
import { Admin } from 'src/admin/entities/admin.entity';
import { Category } from 'src/category/entities/category.entity';
import { RecipeModule } from 'src/recipe/recipe.module';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { SubCategory } from 'src/category/entities/subCategory.entity';

@Module({
  imports: [
    RecipeModule,
    TypeOrmModule.forFeature([
      MenuItem,
      Inventory,
      Admin,
      Category,
      Recipe,
      SubCategory,
    ]),
  ],
  controllers: [MenuItemController],
  providers: [SupabaseProvider, MenuItemService],
  exports: [SupabaseProvider, MenuItemService],
})
export class MenuItemModule {}
