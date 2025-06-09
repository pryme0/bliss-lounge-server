import { IsOptional, IsNumberString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: '10',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ description: 'Search query', example: 'John' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Category id of the menu items',
    example: 'John',
  })
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Customer id',
    example: '99377-393swj3899-838383',
  })
  @IsUUID()
  @IsOptional()
  customerId?: string;
}
