import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import {
  CreateCustomerDto,
  SignInDto,
  RequestResetPasswordDto,
  ResetPasswordDto,
} from '../dto';
import { Admin } from './entities/admin.entity';
import { EmailService } from 'src/utils';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly customerRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly mailService: EmailService,
  ) {}

  // Sign Up
  async signup(input: CreateCustomerDto) {
    const existingUser = await this.customerRepository.findOne({
      where: { email: input.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email is already in use.');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const admin = this.customerRepository.create({
      ...input,
      password: hashedPassword,
    });
    await this.customerRepository.save(admin);
    return { message: 'Admin registered successfully' };
  }

  // Sign In
  async signin(input: SignInDto) {
    const admin = await this.customerRepository.findOne({
      where: { email: input.email },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(input.password, admin.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      phoneNumber: admin.phoneNumber,
    };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '2d',
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { access_token, user: payload, refresh_token };
  }

  // Request Reset Password
  async sendResetPasswordOtp(dto: RequestResetPasswordDto) {
    const admin = await this.customerRepository.findOne({
      where: { email: dto.email },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    admin.resetPasswordOtp = otp;
    admin.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.customerRepository.save(admin);

    await this.mailService.sendMail({
      to: admin.email,
      subject: 'Your Password Reset OTP',
      text: `Your password reset code is: ${otp}`,
    });

    return { message: 'OTP sent to email' };
  }

  // Reset Password
  async resetPassword(dto: ResetPasswordDto) {
    const admin = await this.customerRepository.findOne({
      where: { email: dto.email },
    });
    if (!admin || !admin.resetPasswordOtp) {
      throw new BadRequestException('Invalid reset request');
    }

    if (admin.resetPasswordOtp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (admin.resetPasswordExpires < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    admin.password = await bcrypt.hash(dto.newPassword, 10);
    admin.resetPasswordOtp = null;
    admin.resetPasswordExpires = null;

    await this.customerRepository.save(admin);

    return { message: 'Password reset successful' };
  }
}
