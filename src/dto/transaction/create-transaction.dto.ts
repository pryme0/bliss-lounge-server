import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class CreateTransactionDto {
  @ApiProperty({ example: 50.0 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'card' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'order-uuid' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'reference_id' })
  @IsString()
  @IsNotEmpty()
  reference_id: string;
}
