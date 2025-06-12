import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFiltersDto, AnalyticsResponseDto } from 'src/dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

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
}
