import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
export class CreateCustomerDto {
  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Full name of the customer',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description:
      'New password (at least 6 characters, including one uppercase letter, one lowercase letter, one number, and one special character)',
    example: 'MyP@ssw0rd',
  })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    {
      message:
        'Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  password: string;

  @ApiProperty({
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

export class SignInDto {
  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'New password (at least 6 characters, including one uppercase letter, one lowercase letter, one number, and one special character)',
    example: 'MyP@ssw0rd',
  })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    {
      message:
        'Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  password: string;
}

export class RequestResetPasswordDto {
  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password Reset Otp',
    example: '123456',
  })
  @IsString()
  otp: string;

  @ApiProperty({
    description:
      'New password (at least 6 characters, including one uppercase letter, one lowercase letter, one number, and one special character)',
    example: 'MyP@ssw0rd',
  })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    {
      message:
        'Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  newPassword: string;
}
