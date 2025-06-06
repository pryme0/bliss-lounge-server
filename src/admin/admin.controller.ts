import { Controller, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateCustomerDto,
  RequestResetPasswordDto,
  ResetPasswordDto,
  SignInDto,
} from 'src/dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly authService: AdminService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new customer' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  async signUp(@Body() input: CreateCustomerDto) {
    return this.authService.signup(input);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Authenticate a customer' })
  @ApiResponse({
    status: 200,
    description: 'Customer authenticated successfully',
  })
  async signIn(@Body() input: SignInDto) {
    return this.authService.signin(input);
  }

  @Post('request-reset-password')
  async requestResetPassword(@Body() dto: RequestResetPasswordDto) {
    return this.authService.sendResetPasswordOtp(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
