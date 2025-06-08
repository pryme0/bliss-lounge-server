import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TransactionService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto } from 'src/dto';
import { Transaction } from './entities/transaction.entity';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new transaction' })
  @ApiResponse({ status: 201, type: Transaction })
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all transactions' })
  @ApiResponse({ status: 200, type: [Transaction] })
  findAll() {
    return this.transactionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single transaction by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Transaction ID' })
  @ApiResponse({ status: 200, type: Transaction })
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @Patch('/verify/:reference')
  @ApiOperation({ summary: 'Retrieve a single transaction by ID' })
  @ApiParam({
    name: 'reference',
    type: 'string',
    description: 'Transaction reference',
  })
  @ApiResponse({ status: 200, type: Transaction })
  async verify(@Param('reference') reference: string) {
    return await this.transactionService.verifyPayment(reference);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiParam({ name: 'id', type: 'string', description: 'Transaction ID' })
  @ApiResponse({ status: 200, type: Transaction })
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam({ name: 'id', type: 'string', description: 'Transaction ID' })
  remove(@Param('id') id: string) {
    return this.transactionService.remove(id);
  }
}
