// src/categories/categories.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Category } from './entities/category.entity';
import {
  CreateCategoryDto,
  CursorPaginatedCategoriesDto,
  CursorPaginatedSubCategoriesDto,
  CursorPaginationQueryDto,
  UpdateCategoryDto,
} from 'src/dto';
import { SubCategory } from './entities/subCategory.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const category = this.categoryRepository.create(createCategoryDto);
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL unique violation
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  async findAll(
    paginationQuery: CursorPaginationQueryDto,
  ): Promise<CursorPaginatedCategoriesDto> {
    const { limit, cursor, direction } = paginationQuery;

    // Build the query
    const queryBuilder = this.categoryRepository.createQueryBuilder('category');

    if (cursor) {
      if (direction === 'next') {
        queryBuilder.where('category.id > :cursor', { cursor });
        queryBuilder.orderBy('category.id', 'ASC');
      } else {
        queryBuilder.where('category.id < :cursor', { cursor });
        queryBuilder.orderBy('category.id', 'DESC');
      }
    } else {
      queryBuilder.orderBy('category.id', 'ASC');
    }

    queryBuilder.limit(limit + 1); // Get one extra to check if there's a next page

    const categories = await queryBuilder.getMany();
    const totalCount = await this.categoryRepository.count();

    // Check if there are more items
    const hasNextPage = categories.length > limit;
    const hasPreviousPage = cursor ? true : false;

    // Remove the extra item if it exists
    if (hasNextPage) {
      categories.pop();
    }

    // If we queried in reverse order, reverse the results
    if (direction === 'prev') {
      categories.reverse();
    }

    // Calculate cursors
    let nextCursor: string | null = null;
    let previousCursor: string | null = null;

    if (categories.length > 0) {
      if (hasNextPage) {
        nextCursor = categories[categories.length - 1].id;
      }
      if (hasPreviousPage) {
        previousCursor = categories[0].id;
      }
    }

    return {
      data: categories,
      meta: {
        totalCount,
        hasNextPage,
        hasPreviousPage,
        nextCursor,
        previousCursor,
      },
    };
  }

  async findAllSubcategories(
    query: CursorPaginationQueryDto,
  ): Promise<CursorPaginatedSubCategoriesDto> {
    const { limit = 10, cursor, direction = 'next' } = query;

    const queryBuilder = this.subCategoryRepository
      .createQueryBuilder('subCategory')
      .leftJoinAndSelect('subCategory.category', 'category');

    // Apply cursor-based filtering
    if (cursor) {
      if (direction === 'next') {
        queryBuilder.where('subCategory.id > :cursor', { cursor });
        queryBuilder.orderBy('subCategory.id', 'ASC');
      } else {
        queryBuilder.where('subCategory.id < :cursor', { cursor });
        queryBuilder.orderBy('subCategory.id', 'DESC');
      }
    } else {
      queryBuilder.orderBy('subCategory.id', 'ASC');
    }

    queryBuilder.limit(limit + 1); // Fetch one extra item to check if there's a next page

    let items = await queryBuilder.getMany();

    const hasNextPage = items.length > limit;
    if (hasNextPage) {
      items = items.slice(0, limit);
    }

    if (cursor && direction === 'prev') {
      items.reverse();
    }

    const nextCursor = hasNextPage
      ? (items[items.length - 1]?.id ?? null)
      : null;
    const hasPreviousPage = !!cursor;
    const previousCursor = hasPreviousPage ? (items[0]?.id ?? null) : null;

    const totalCount = await this.subCategoryRepository.count();

    return {
      data: items,
      meta: {
        totalCount,
        hasNextPage,
        hasPreviousPage,
        nextCursor,
        previousCursor,
      },
    };
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    try {
      Object.assign(category, updateCategoryDto);
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}
