import { Module } from '@nestjs/common';
import { CategoriesService } from './category.service';
import { CategoriesController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { SubCategory } from './entities/subCategory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category,SubCategory])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoryModule {}
