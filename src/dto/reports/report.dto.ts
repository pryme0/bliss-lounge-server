import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsString,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsOptional,
  IsEmail,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfterOrEqual', async: false })
export class IsAfterOrEqual implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return new Date(value) >= new Date(relatedValue);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be after or equal to ${args.constraints[0]}`;
  }
}

export enum ReportType {
  ORDERS = 'orders',
  RESERVATIONS = 'reservations',
  INVENTORY = 'inventory',
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Type of report to generate' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Start date in YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Start date must be in YYYY-MM-DD format',
  })
  startDate: string;

  @ApiProperty({ description: 'End date in YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'End date must be in YYYY-MM-DD format',
  })
  @Validate(IsAfterOrEqual, ['startDate'])
  endDate: string;

  @ApiProperty({ enum: ReportFormat, description: 'Output format' })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiProperty({
    description:
      'Comma-separated email addresses to send the report to (optional)',
    example: 'user1@example.com,user2@example.com',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((email) => email.trim())
      : value,
  )
  @IsEmail({}, { each: true, message: 'Each email address must be valid' })
  emailRecipients?: string[];
}

export interface OrderReport {
  totalOrders: number;
  totalRevenue: number;
  statusBreakdown: { [status: string]: number };
  orders: Array<{
    id: string;
    customerName: string;
    totalPrice: number;
    status: string;
    createdAt: string;
  }>;
}

export interface ReservationReport {
  totalReservations: number;
  totalGuests: number;
  statusBreakdown: { [status: string]: number };
  reservations: Array<{
    id: string;
    name: string;
    email: string;
    date: string;
    time: string;
    guests: number;
    status: string;
    createdAt: string;
  }>;
}

export interface InventoryReport {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  statusBreakdown: { [status: string]: number };
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalValue: number;
    status: string;
  }>;
}

export type ReportResponse = OrderReport | ReservationReport | InventoryReport;
