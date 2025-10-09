import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsUrl,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Event description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Event location', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Event date and time (ISO 8601 format)' })
  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @ApiProperty({
    description: 'Event end date and time (ISO 8601 format)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  eventEndDate?: string;

  @ApiProperty({
    description: 'Event image',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  image?: any;

  @ApiProperty({
    description: 'Whether the event is published',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ description: 'Event organizer name', required: false })
  @IsString()
  @IsOptional()
  organizer?: string;

  @ApiProperty({ description: 'Ticket price', required: false })
  @IsNumber()
  @IsOptional()
  ticketPrice?: number;

  @ApiProperty({ description: 'Ticket purchase link', required: false })
  @IsUrl()
  @IsOptional()
  ticketLink?: string;

  @ApiProperty({ description: 'Event capacity', required: false })
  @IsNumber()
  @IsOptional()
  capacity?: number;
}

