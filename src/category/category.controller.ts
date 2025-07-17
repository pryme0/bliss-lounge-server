import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CategoriesService } from './category.service';
import { Category } from './entities/category.entity';
import {
  CreateCategoryDto,
  CursorPaginatedCategoriesDto,
  CursorPaginatedSubCategoriesDto,
  CursorPaginationQueryDto,
  UpdateCategoryDto,
} from 'src/dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: Category,
  })
  @ApiResponse({
    status: 409,
    description: 'Category name already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories with cursor pagination' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (1-100)',
    example: 10,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor for pagination (category ID)',
    example: 28540,
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    description: 'Pagination direction',
    enum: ['next', 'prev'],
    example: 'next',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: CursorPaginatedCategoriesDto,
  })
  async findAll(
    @Query() paginationQuery: CursorPaginationQueryDto,
  ): Promise<CursorPaginatedCategoriesDto> {
    return this.categoriesService.findAll(paginationQuery);
  }

  @Get('/subcategories')
  @ApiOperation({ summary: 'Get all categories with cursor pagination' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (1-100)',
    example: 10,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor for pagination (category ID)',
    example: 28540,
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    description: 'Pagination direction',
    enum: ['next', 'prev'],
    example: 'next',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: CursorPaginatedCategoriesDto,
  })
  async findAllSubcategories(
    @Query() paginationQuery: CursorPaginationQueryDto,
  ): Promise<CursorPaginatedSubCategoriesDto> {
    return this.categoriesService.findAllSubcategories(paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 28540,
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async findOne(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 28540,
  })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Category name already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: 28540,
  })
  @ApiResponse({
    status: 204,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.categoriesService.remove(id);
  }
}
