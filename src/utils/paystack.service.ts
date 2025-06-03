import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as paystack from 'paystack';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackService {
  private paystackInstance;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    this.paystackInstance = paystack(secretKey);
  }

  async initializeTransaction(
    amount: number,
    email: string,
    reference: string,
  ): Promise<any> {
    try {
      const response = await this.paystackInstance.transaction.initialize({
        amount: amount * 100, // amount in kobo (₦1 = 100 kobo)
        email,
        reference,
        currency: 'NGN',
      });
      return response;
    } catch (error) {
      console.error('Paystack initializeTransaction error:', error);
      throw new InternalServerErrorException('Payment initialization failed');
    }
  }

  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response =
        await this.paystackInstance.transaction.verify(reference);
      return response;
    } catch (error) {
      console.error('Paystack verifyTransaction error:', error);
      throw new InternalServerErrorException('Payment verification failed');
    }
  }
}
