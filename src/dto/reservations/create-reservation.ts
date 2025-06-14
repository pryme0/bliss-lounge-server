import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsInt,
  Min,
  Max,
  IsOptional,
  Length,
  Matches,
  IsIn,
} from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Time must be in HH:MM format (24-hour)',
  })
  time: string;

  @IsInt()
  @Min(1, { message: 'Guests must be at least 1' })
  @Max(10, { message: 'Guests cannot exceed 10' })
  guests: number;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;

  @IsString()
  @Matches(/^\+?\d{10,15}$/, {
    message: 'Phone number must be 10–15 digits, optionally starting with +',
  })
  phoneNumber: string;
}

export class UpdateReservationDto {
  @ApiProperty({
    description: 'Reservation status',
    enum: ['pending', 'confirmed', 'cancelled'],
    example: 'confirmed',
  })
  @IsIn(['pending', 'confirmed', 'cancelled'], {
    message: 'Status must be one of: pending, confirmed, cancelled',
  })
  status: 'pending' | 'confirmed' | 'cancelled';
}

export class ReservationResponseDto {
  id: string;
  name: string;
  email: string;
  date: string;
  time: string;
  phoneNumber: string;
  guests: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
