import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './report.service';
import { GenerateReportDto, ReportFormat } from 'src/dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomJwtAuthGuard } from 'src/utils/guard';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @UseGuards(CustomJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Generate a report for orders, reservations, or inventory, optionally sending to email',
  })
  @ApiResponse({
    status: 200,
    description: 'Report generated or emailed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async generateReport(@Body() dto: GenerateReportDto, @Res() res: Response) {
    const { data, buffer, message } =
      await this.reportsService.generateReport(dto);

    if (message) {
      return res.status(HttpStatus.OK).json({ message });
    }

    if (dto.format === ReportFormat.JSON) {
      return res.status(HttpStatus.OK).json(data);
    } else if (dto.format === ReportFormat.CSV) {
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${dto.type}-report-${dto.startDate}-${dto.endDate}.csv`,
      });
      return res.status(HttpStatus.OK).send(buffer);
    } else if (dto.format === ReportFormat.PDF) {
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${dto.type}-report-${dto.startDate}-${dto.endDate}.pdf`,
      });
      return res.status(HttpStatus.OK).send(buffer);
    }
  }
}
