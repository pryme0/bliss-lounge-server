import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';

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
  menuItemIds: string[];

  @ApiProperty({ example: 59.99, description: 'Total price of the order' })
  @IsNumber()
  @Min(0)
  totalPrice: number;
}
