// src/auth/auth.service.ts

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Customer } from 'src/customers/entities/customer.entity';
import {
  CreateCustomerDto,
  RequestResetPasswordDto,
  ResetPasswordDto,
  SignInDto,
} from 'src/dto';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly jwtService: JwtService,
    private readonly mailService: EmailService,
  ) {}

  /**
   * Customer signup
   */
  async signup(createAuthDto: CreateCustomerDto): Promise<{
    user: Customer;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password, phoneNumber, fullName } = createAuthDto;

    // Check for existing email or phone number
    const existingCustomer = await this.customerRepository.findOne({
      where: [{ email: email.toLowerCase() }, { phoneNumber: phoneNumber }],
    });

    if (existingCustomer) {
      throw new BadRequestException(
        'Customer with this email or phone number already exists.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = this.customerRepository.create({
      email: email.toLowerCase(),
      fullName,
      phoneNumber,
      password: hashedPassword,
    });

    const savedCustomer = await this.customerRepository.save(newCustomer);

    // Generate JWT tokens
    const payload = { sub: savedCustomer.id, email: savedCustomer.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      user: savedCustomer,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Customer signin
   */
  async signin(input: SignInDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<Customer, 'password'>;
  }> {
    const { email, password } = input;

    const customer = await this.customerRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Generate tokens
    const payload = { sub: customer.id, email: customer.email };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // Remove password from returned object
    const { password: _, ...userWithoutPassword } = customer;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async sendResetPasswordOtp(input: RequestResetPasswordDto): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { email: input.email.toLowerCase() },
    });

    if (!customer) {
      throw new BadRequestException('No customer found with this email.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    customer.resetPasswordOtp = otp;
    customer.resetPasswordExpires = expires;

    await this.customerRepository.save(customer);

    await this.mailService.sendMail({
      to: customer.email,
      subject: 'Your Password Reset OTP',
      text: `Your password reset code is: ${otp}`,
    });
  }

  async resetPassword(input: ResetPasswordDto): Promise<{ message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { email: input.email.toLowerCase() },
    });

    if (
      !customer ||
      !customer.resetPasswordOtp ||
      !customer.resetPasswordExpires
    ) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    const now = new Date();
    if (
      customer.resetPasswordExpires < now ||
      customer.resetPasswordOtp !== input.otp
    ) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    customer.password = await bcrypt.hash(input.newPassword, 10);
    customer.resetPasswordOtp = null;
    customer.resetPasswordExpires = null;

    await this.customerRepository.save(customer);
    return { message: 'Password reset successfully' };
  }
}
