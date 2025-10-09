import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateEventDto, UpdateEventDto, PaginationQueryDto } from 'src/dto';
import { Event } from './entities/event.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomJwtAuthGuard } from 'src/utils/guard';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(CustomJwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, type: Event })
  create(
    @Body() createEventDto: CreateEventDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.eventsService.create(createEventDto, image);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'includeUnpublished',
    required: false,
    type: Boolean,
    description: 'Include unpublished events',
  })
  @ApiResponse({ status: 200, type: [Event] })
  findAll(@Query() query: PaginationQueryDto) {
    return this.eventsService.findAll(
      parseInt(query.page) || 1,
      parseInt(query.limit) || 10,
      query.search,
      query.includeUnpublished === 'true',
    );
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiResponse({ status: 200, type: [Event] })
  findUpcoming(@Query() query: PaginationQueryDto) {
    return this.eventsService.findUpcoming(
      parseInt(query.page) || 1,
      parseInt(query.limit) || 10,
      query.search,
    );
  }

  @Get('past')
  @ApiOperation({ summary: 'Get past events' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiResponse({ status: 200, type: [Event] })
  findPast(@Query() query: PaginationQueryDto) {
    return this.eventsService.findPast(
      parseInt(query.page) || 1,
      parseInt(query.limit) || 10,
      query.search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, type: Event })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/is-past')
  @ApiOperation({ summary: 'Check if an event has passed' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, schema: { type: 'boolean' } })
  async isEventPast(@Param('id') id: string) {
    const isPast = await this.eventsService.isEventPast(id);
    return { isPast };
  }

  @Patch(':id')
  @UseGuards(CustomJwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, type: Event })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.eventsService.update(id, updateEventDto, image);
  }

  @Delete(':id')
  @UseGuards(CustomJwtAuthGuard)
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}

