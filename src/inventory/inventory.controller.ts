import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  PaginatedResponse,
  PaginationQueryDto,
  UpdateInventoryDto,
} from 'src/dto';
import { Inventory } from './entities/inventory.entity';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiResponse({
    status: 201,
    description: 'Item created successfully',
    type: Inventory,
  })
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of inventory items' })
  @ApiResponse({
    status: 200,
    description: 'Paginated inventory list',
    type: PaginatedResponse<Inventory>,
  })
  async findAll(@Query() paginationQueryDto: PaginationQueryDto) {
    return this.inventoryService.findAll(paginationQueryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single inventory item' })
  @ApiParam({ name: 'id', type: 'number', description: 'Inventory item ID' })
  @ApiResponse({
    status: 200,
    description: 'Single inventory item',
    type: Inventory,
  })
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiParam({ name: 'id', type: 'number', description: 'Inventory item ID' })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: Inventory,
  })
  async update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an inventory item' })
  @ApiParam({ name: 'id', type: 'number', description: 'Inventory item ID' })
  @ApiResponse({ status: 200, description: 'Item soft deleted successfully' })
  async softDelete(@Param('id') id: string) {
    return this.inventoryService.softDelete(id);
  }
}
