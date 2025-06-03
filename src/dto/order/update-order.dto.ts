import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsUUID, IsEnum } from 'class-validator';

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ type: [String], description: 'List of menu item IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  menuItemIds?: string[];

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Order status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
