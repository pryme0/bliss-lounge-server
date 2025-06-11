import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({
    example: 'Margherita Pizza',
    description: 'Name of the menu item',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Classic pizza with tomato and mozzarella',
    description: 'Description of the menu item',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 12.99,
    description: 'Price of the menu item',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: 8.5,
    description: 'Cost of ingredients for the menu item',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the category',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}