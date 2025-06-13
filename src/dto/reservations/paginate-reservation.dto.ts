import { IsInt, Min, IsOptional, IsString, Matches } from 'class-validator';
import { ReservationResponseDto } from './create-reservation';

export class PaginatedReservationsDto {
  data: ReservationResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class FindAllReservationsQueryDto {
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  endDate?: string;
}
