import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsString,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: 'e1781b8d-5f0e-4c0b-a5d7-1a48b437c38c',
    description: 'Customer ID',
  })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ type: [String], description: 'List of menu item IDs' })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty()
  items: { menuItemId: string; quantity: number }[];

  @ApiProperty({ example: 59.99, description: 'Total price of the order' })
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiProperty({
    example: '29 usuma street',
    description: 'Customers delivery address',
  })
  @IsUUID()
  @IsNotEmpty()
  deliveryAddress: string;
}

export class CreateOrderResponse {
  @ApiProperty({
    example: 'https://paystack-payment-initialization',
    description: 'payment authorization url',
  })
  @IsNotEmpty()
  @IsString()
  authorization_url: string;
  @ApiProperty({
    example: 'iiwjw08',
    description: 'Payment authorization access_code',
  })
  @IsNotEmpty()
  @IsString()
  access_code: string;

  @ApiProperty({
    example: 'iiwjjwury-8948wjhry4je8w-ke4834j383',
    description: 'Payment reference code',
  })
  @IsNotEmpty()
  @IsString()
  reference: string;
}
