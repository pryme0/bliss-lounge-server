import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaginatedResponse, PaginationQueryDto } from 'src/dto';
import { Customer } from './entities/customer.entity';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of customers' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of customers',
    type: PaginatedResponse,
  })
  async getCustomers(@Query() input: PaginationQueryDto) {
    return this.customersService.findAll(
      parseInt(input.page),
      parseInt(input.limit),
      input.search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single customer by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Single customer record',
    type: Customer,
  })
  async getCustomerById(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a customer by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer soft deleted successfully',
  })
  async softDeleteCustomer(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
