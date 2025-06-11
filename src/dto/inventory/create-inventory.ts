import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { InventoryUnitEnum } from 'src/inventory/entities/inventory.entity';

export class CreateInventoryDto {
  @ApiProperty({
    example: 'Tomatoes',
    description: 'Name of the inventory item',
  })
  @IsNotEmpty()
  @IsString()
  itemName: string;

  @ApiProperty({ example: 100, description: 'Quantity of the item' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 2.5, description: 'Unit price of the item' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    enum: InventoryUnitEnum,
    example: InventoryUnitEnum.KG,
    description: 'Unit of the inventory item',
  })
  @IsNotEmpty()
  @IsEnum(InventoryUnitEnum)
  unit: string;

  @ApiProperty({
    example: 10,
    description: 'Minimum stock level to trigger low-stock status',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  minimumStock: number;

  @ApiProperty({
    example: 'Fresh red tomatoes',
    required: false,
    description: 'Description of the item',
  })
  @IsOptional()
  @IsString()
  description?: string;
}