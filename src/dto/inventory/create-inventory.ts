import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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

  @ApiProperty({
    example: 'Fresh red tomatoes',
    required: false,
    description: 'Description of the item',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
