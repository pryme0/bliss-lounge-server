import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateInventoryDto {
  @ApiPropertyOptional({
    example: 'Tomatoes',
    description: 'Name of the inventory item',
  })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({ example: 100, description: 'Quantity of the item' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ example: 2.5, description: 'Unit price of the item' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Minimum stock level to trigger low-stock status',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumStock?: number;

  @ApiPropertyOptional({
    example: 'Fresh red tomatoes',
    description: 'Description of the item',
  })
  @IsOptional()
  @IsString()
  description?: string;
}