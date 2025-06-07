import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsPositive, Min, Max, IsNumber } from 'class-validator';
import { Category } from 'src/category/entities/category.entity';

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
