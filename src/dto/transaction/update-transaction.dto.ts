import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: 'completed' })
  @IsOptional()
  @IsString()
  status?: string;
}
