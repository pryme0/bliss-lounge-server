import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { InventoryUnitEnum } from '../enum';

export class CreateRecipeDto {
  @ApiProperty({
    description: 'ID of the menu item',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  menuItemId: string;

  @ApiProperty({
    description: 'ID of the inventory item',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  inventoryId: string;

  @ApiProperty({
    description: 'Quantity of the inventory item required',
    example: 0.2,
  })
  @IsNumber()
  @Min(0.01, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @ApiProperty({
    description: 'Unit of measurement',
    enum: InventoryUnitEnum,
    example: InventoryUnitEnum.KG,
    required: false,
  })
  @IsOptional()
  @IsEnum(InventoryUnitEnum, { message: 'Invalid unit' })
  unit?: InventoryUnitEnum;
}
