import { IsOptional, IsEmail, IsString, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Full name of the customer',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Array of customer addresses',
    example: [
      '123 Main Street, Lagos, Nigeria',
      '456 Victoria Island, Lagos, Nigeria',
    ],
    required: false,
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, {
    message: 'At least one address is required if addresses are provided',
  })
  @ArrayMaxSize(5, { message: 'Maximum of 5 addresses allowed' })
  addresses?: string[];
}
