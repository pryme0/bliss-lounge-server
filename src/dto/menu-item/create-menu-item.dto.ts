import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
} from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Cheeseburger' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'A tasty cheeseburger with fries', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 9.99 })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: string;

  @ApiProperty({
    example: 'e1781b8d-5f0e-4c0b-a5d7-1a48b437c38c',
    description: 'Category ID',
  })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;
}

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
