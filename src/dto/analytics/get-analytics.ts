import {
  IsNumber,
  IsString,
  IsArray,
  IsDateString,
  IsOptional,
  ValidateIf,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TopSellingItemDto {
  @IsString()
  menuItemId: string;

  @IsString()
  name: string;

  @IsNumber()
  totalQuantity: number;

  @IsNumber()
  totalRevenue: number;

  @IsString()
  imageUrl: string;
}

export class RevenueGraphPointDto {
  @IsDateString()
  date: string;

  @IsNumber()
  revenue: number;
}

export class AnalyticsResponseDto {
  @IsNumber()
  totalRevenue: number;

  @IsNumber()
  totalRevenueChange: number;

  @IsNumber()
  totalOrders: number;

  @IsNumber()
  totalOrdersChange: number;

  @IsNumber()
  totalCustomers: number;

  @IsNumber()
  totalCustomersChange: number;

  @IsNumber()
  averageOrderValue: number;

  @IsNumber()
  averageOrderValueChange: number;

  @IsArray()
  topSellingItems: TopSellingItemDto[];

  @IsArray()
  revenueGraph: RevenueGraphPointDto[];
}

export class AnalyticsFiltersDto {
  @IsOptional()
  @IsDateString()
  @Type(() => String)
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  @Type(() => String)
  @ValidateIf((o) => o.startDate, {
    message: 'endDate must be after startDate',
  })
  endDate?: Date;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @Type(() => String)
  menuItemIds?: string[];
}

export class InventoryMetricsDto {
  total_inventory_value: number;
  total_variance_cost: number;
  profit_loss_value: number;
}

export class InventoryMetricsFiltersDto {
  startDate?: string;
  endDate?: string;
}
