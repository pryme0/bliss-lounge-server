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
    callback: string,
    amount: number,
    email: string,
    reference: string,
  ): Promise<any> {
    try {
      const response = await this.paystackInstance.transaction.initialize({
        amount: amount * 100,
        email,
        reference,
        currency: 'NGN',
        callback_url: callback,
      });
      return response;
    } catch (error) {
      console.error('Paystack initializeTransaction error:', error);
      throw new InternalServerErrorException('Payment initialization failed');
    }
  }

  async verifyTransaction(reference: string): Promise<any> {
    try {
      return await this.paystackInstance.transaction.verify(reference);
    } catch (error) {
      console.error('Paystack verifyTransaction error:', error);
      throw new InternalServerErrorException('Payment verification failed');
    }
  }
}
