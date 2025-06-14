import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsFiltersDto,
  AnalyticsResponseDto,
  InventoryMetricsDto,
  InventoryMetricsFiltersDto,
} from 'src/dto';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CustomJwtAuthGuard } from 'src/utils/guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(CustomJwtAuthGuard)
  @Get()
  async getAnalytics(
    @Query(ValidationPipe) filters: AnalyticsFiltersDto,
  ): Promise<AnalyticsResponseDto> {
    const { startDate, endDate } = filters;
    return this.analyticsService.getAnalytics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @UseGuards(CustomJwtAuthGuard)
  @Get('inventory-metrics')
  @ApiOperation({ summary: 'Get inventory metrics' })
  @ApiResponse({
    status: 200,
    description: 'Inventory metrics retrieved successfully',
    type: InventoryMetricsDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2025-05-15',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2025-06-14',
  })
  async getInventoryMetrics(
    @Query(ValidationPipe) filters: InventoryMetricsFiltersDto,
  ): Promise<InventoryMetricsDto> {
    console.log('getInventoryMetrics endpoint:', {
      filters,
      timestamp: new Date().toISOString(),
    });
    return this.analyticsService.getInventoryMetrics(filters);
  }
}
