import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { DiscountType, DiscountScope } from 'src/discounts/entities/discount.entity';

export class CreateDiscountDto {
  @ApiProperty({ description: 'Discount name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Discount description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type of discount',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType)
  @IsNotEmpty()
  type: DiscountType;

  @ApiProperty({
    description: 'Discount value (percentage: 0-100, fixed: any positive number)',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  value: number;

  @ApiProperty({
    description: 'Discount scope - applies to specific items or all items',
    enum: DiscountScope,
    example: DiscountScope.SPECIFIC_ITEMS,
  })
  @IsEnum(DiscountScope)
  @IsNotEmpty()
  scope: DiscountScope;

  @ApiProperty({
    description: 'Menu item IDs to apply discount to (required if scope is SPECIFIC_ITEMS)',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  menuItemIds?: string[];

  @ApiProperty({
    description: 'Whether the discount is active',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Start date for the discount (ISO 8601 format)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the discount (ISO 8601 format)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

