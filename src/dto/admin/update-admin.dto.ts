import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'phoneNumber must be a valid E.164 international phone number',
  })
  phoneNumber?: string;
}
