import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import {
  CreateOrderDto,
  CreateOrderResponse,
  PaginatedResponse,
  PaginationQueryDto,
  UpdateOrderDto,
} from 'src/dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order' })
  @ApiResponse({ status: 201, description: 'Order created', type: Order })
  async create(
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<CreateOrderResponse> {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders (paginated)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of orders',
    type: PaginatedResponse<Order>,
  })
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Order>> {
    const { data, total } = await this.ordersService.findAll(query);
    return {
      data,
      total,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({ status: 200, description: 'Order found', type: Order })
  async findOne(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  @ApiResponse({ status: 200, description: 'Order updated', type: Order })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order' })
  @ApiResponse({ status: 200, description: 'Order deleted' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.ordersService.remove(id);
  }
}
