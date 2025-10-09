import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CreateDiscountDto, UpdateDiscountDto, PaginationQueryDto } from 'src/dto';
import { Discount, DiscountScope } from './entities/discount.entity';
import { CustomJwtAuthGuard } from 'src/utils/guard';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @UseGuards(CustomJwtAuthGuard)
  @ApiOperation({ summary: 'Create a new discount' })
  @ApiBody({ type: CreateDiscountDto })
  @ApiResponse({ status: 201, type: Discount })
  create(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountsService.create(createDiscountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all discounts' })
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
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: DiscountScope,
    description: 'Filter by discount scope',
  })
  @ApiResponse({ status: 200, type: [Discount] })
  findAll(@Query() query: PaginationQueryDto & { isActive?: string; scope?: DiscountScope }) {
    const isActive = query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined;
    return this.discountsService.findAll(
      parseInt(query.page) || 1,
      parseInt(query.limit) || 10,
      query.search,
      isActive,
      query.scope,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active discounts' })
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
  @ApiResponse({ status: 200, type: [Discount] })
  findActive(@Query() query: PaginationQueryDto) {
    return this.discountsService.findAll(
      parseInt(query.page) || 1,
      parseInt(query.limit) || 10,
      undefined,
      true,
    );
  }

  @Get('menu-item/:menuItemId')
  @ApiOperation({ summary: 'Get active discounts for a specific menu item' })
  @ApiParam({ name: 'menuItemId', description: 'Menu item ID' })
  @ApiResponse({ status: 200, type: [Discount] })
  getActiveDiscountsForMenuItem(@Param('menuItemId') menuItemId: string) {
    return this.discountsService.getActiveDiscountsForMenuItem(menuItemId);
  }

  @Get('menu-item/:menuItemId/best')
  @ApiOperation({ summary: 'Get the best discount for a menu item' })
  @ApiParam({ name: 'menuItemId', description: 'Menu item ID' })
  @ApiResponse({ 
    status: 200, 
    schema: {
      type: 'object',
      properties: {
        discount: { type: 'object', nullable: true },
        discountedPrice: { type: 'number' },
        originalPrice: { type: 'number' },
      },
    },
  })
  getBestDiscountForMenuItem(@Param('menuItemId') menuItemId: string) {
    return this.discountsService.getBestDiscountForMenuItem(menuItemId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a discount by ID' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, type: Discount })
  findOne(@Param('id') id: string) {
    return this.discountsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(CustomJwtAuthGuard)
  @ApiOperation({ summary: 'Update a discount' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, type: Discount })
  update(
    @Param('id') id: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.discountsService.update(id, updateDiscountDto);
  }

  @Patch(':id/toggle')
  @UseGuards(CustomJwtAuthGuard)
  @ApiOperation({ summary: 'Toggle discount active status' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, type: Discount })
  toggleActive(@Param('id') id: string) {
    return this.discountsService.toggleActive(id);
  }

  @Post(':id/menu-items')
  @UseGuards(CustomJwtAuthGuard)
  @ApiOperation({ summary: 'Add menu items to a discount' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        menuItemIds: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: Discount })
  addMenuItems(
    @Param('id') id: string,
    @Body() body: { menuItemIds: string[] },
  ) {
    return this.discountsService.addMenuItems(id, body.menuItemIds);
  }

  @Post(':id/menu-items/all')
  @UseGuards(CustomJwtAuthGuard)
  @ApiOperation({ summary: 'Add all menu items to a discount' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, type: Discount })
  addAllMenuItems(@Param('id') id: string) {
    return this.discountsService.addAllMenuItems(id);
  }

  @Delete(':id/menu-items')
  @UseGuards(CustomJwtAuthGuard)
  @ApiOperation({ summary: 'Remove menu items from a discount' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        menuItemIds: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: Discount })
  removeMenuItems(
    @Param('id') id: string,
    @Body() body: { menuItemIds: string[] },
  ) {
    return this.discountsService.removeMenuItems(id, body.menuItemIds);
  }

  @Delete(':id/menu-items/all')
  @UseGuards(CustomJwtAuthGuard)
  @ApiOperation({ summary: 'Remove all menu items from a discount' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, type: Discount })
  removeAllMenuItems(@Param('id') id: string) {
    return this.discountsService.removeAllMenuItems(id);
  }

  @Delete(':id')
  @UseGuards(CustomJwtAuthGuard)
  @ApiOperation({ summary: 'Delete a discount' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.discountsService.remove(id);
  }
}

