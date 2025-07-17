import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  IsEnum,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { InventoryUnitEnum } from '../enum';

export class CreateMenuItemRecipeDto {
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

export class CreateMenuItemDto {
  @ApiProperty({
    example: 'Margherita Pizza',
    description: 'Name of the menu item',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Classic pizza with tomato and mozzarella',
    description: 'Description of the menu item',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 12.99, description: 'Price of the menu item' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 8.5,
    description:
      'Cost of ingredients for the menu item (calculated if recipes provided)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the category',
  })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID()
  subCategoryId: string;

  @ApiProperty({
    type: [CreateMenuItemRecipeDto],
    description: 'List of recipes (ingredients) for the menu item',
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  recipes?: CreateMenuItemRecipeDto[];

  @ApiPropertyOptional({
    example: 'true',
    description: 'Flag to determine if the menu item is featured',
  })
  @IsOptional()
  @IsString()
  featured?: string;
}

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
