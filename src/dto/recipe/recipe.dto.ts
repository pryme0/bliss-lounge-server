import { ApiProperty } from '@nestjs/swagger';
import { InventoryUnitEnum } from '../enum';

export class RecipeResponseDto {
  @ApiProperty({
    description: 'ID of the recipe',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the menu item',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  menuItemId: string;

  @ApiProperty({
    description: 'ID of the inventory item',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  inventoryId: string;

  @ApiProperty({
    description: 'Quantity of the inventory item required',
    example: 0.2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit of measurement',
    enum: InventoryUnitEnum,
    example: InventoryUnitEnum.KG,
  })
  unit?: string;

  @ApiProperty({
    description: 'Creation date',
    example: '2025-06-11T12:00:00.000Z',
  })
  createdAt: Date;
}
