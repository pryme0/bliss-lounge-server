import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  HttpCode,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import {
  CreateReservationDto,
  ReservationResponseDto,
  PaginatedReservationsDto,
  FindAllReservationsQueryDto,
} from 'src/dto';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({
    status: 201,
    description: 'Reservation created',
    type: ReservationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input or capacity exceeded' })
  @ApiConflictResponse({ description: 'Duplicate reservation' })
  async create(
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    return this.reservationsService.create(createReservationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all reservations with pagination and date range filter',
  })
  @ApiResponse({
    status: 200,
    description: 'List of reservations',
    type: PaginatedReservationsDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid pagination or date parameters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by email',
  })
  async findAll(
    @Query() query: FindAllReservationsQueryDto,
  ): Promise<PaginatedReservationsDto> {
    // Ensure query params are parsed as numbers
    query.page = Number(query.page) || 1;
    query.limit = Number(query.limit) || 10;
    return this.reservationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reservation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation details',
    type: ReservationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Reservation not found' })
  @ApiParam({ name: 'id', description: 'Reservation ID', type: String })
  async findOne(@Param('id') id: string): Promise<ReservationResponseDto> {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiResponse({
    status: 200,
    description: 'Reservation cancelled',
    type: ReservationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Reservation not found or already cancelled',
  })
  @ApiParam({ name: 'id', description: 'Reservation ID', type: String })
  async cancel(@Param('id') id: string): Promise<ReservationResponseDto> {
    return this.reservationsService.cancel(id);
  }
}
