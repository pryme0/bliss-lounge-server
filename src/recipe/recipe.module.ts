import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { Recipe } from './entities/recipe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, MenuItem, Inventory])],
  controllers: [RecipeController],
  providers: [RecipeService],
})
export class RecipeModule {}
