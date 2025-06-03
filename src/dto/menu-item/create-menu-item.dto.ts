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

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file for the menu item',
  })
  image: any;

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
  isAvailable?: boolean;
}

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
