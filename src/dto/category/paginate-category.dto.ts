import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsPositive, Min, Max, IsNumber } from 'class-validator';
import { Category } from 'src/category/entities/category.entity';
import { SubCategory } from 'src/category/entities/subCategory.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';

export class CursorPaginatedCategoriesDto {
  @ApiProperty({
    description: 'Array of categories',
    type: [Category],
  })
  data: Category[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      totalCount: 34,
      hasNextPage: true,
      hasPreviousPage: false,
      nextCursor: 10,
      previousCursor: null,
    },
  })
  meta: {
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
  };
}

export class CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsPositive()
  @Min(1)
  @Max(100)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Cursor for pagination (category ID)',
    example: 28540,
    minimum: 1,
  })
  @IsOptional()
  @IsPositive()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Direction of pagination',
    example: 'next',
    enum: ['next', 'prev'],
    default: 'next',
  })
  @IsOptional()
  direction?: 'next' | 'prev' = 'next';
}



export class SubCategoryResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  categoryId: string;

  @Expose()
  @Type(() => Category)
  category: Category;

  @Expose()
  @Type(() => MenuItem)
  menuItems: MenuItem[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}


export class CursorPaginatedSubCategoriesDto {
  @ApiProperty({
    description: 'Array of sub-categories',
    type: [SubCategory],
  })
  data: SubCategory[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      totalCount: 34,
      hasNextPage: true,
      hasPreviousPage: false,
      nextCursor: '2024-07-17T12:00:00.000Z',
      previousCursor: null,
    },
  })
  meta: {
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
  };
}
