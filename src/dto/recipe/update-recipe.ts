import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { InventoryUnitEnum } from 'src/inventory/entities/inventory.entity';

export class UpdateRecipeDto {
  @ApiProperty({
    description: 'Quantity of the inventory item required',
    example: 0.3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Quantity must be greater than 0' })
  quantity?: number;

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
