import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { Recipe } from './entities/recipe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, MenuItem])],
  controllers: [RecipeController],
  providers: [RecipeService],
  exports: [RecipeService, TypeOrmModule],
})
export class RecipeModule {}
