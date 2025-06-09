import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsArray,
  IsUUID,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdateOrderDto {
  @ApiProperty({ type: [String], description: 'List of menu item IDs' })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty()
  items: { menuItemId: string; quantity: number }[];

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Order status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
