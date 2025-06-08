import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionStatus,
} from 'src/dto';
import { Order } from 'src/orders/entities/order.entity';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { PaystackService } from 'src/utils';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly paystackService: PaystackService,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { orderId, amount, paymentMethod } = createTransactionDto;

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Generate a unique reference using orderId and a short unique ID
    const uniqueSuffix = uuidv4();
    const referenceId = `${orderId}-${uniqueSuffix}`;

    const transaction = this.transactionRepository.create({
      amount,
      paymentMethod,
      status: TransactionStatus.PENDING,
      order,
      referenceId, // Assign the generated referenceId
    });

    return this.transactionRepository.save(transaction);
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionRepository.find({ relations: ['order'] });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(id);

    Object.assign(transaction, updateTransactionDto);

    return this.transactionRepository.save(transaction);
  }

  async remove(id: string): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionRepository.softRemove(transaction);
  }

  async initializePayment(
    amount: number,
    email: string,
    orderId: string,
  ): Promise<any> {
    const reference = `ORD-${orderId}-${Date.now()}`;

    // Save the transaction with status pending
    const transaction = this.transactionRepository.create({
      referenceId: reference,
      amount,
      order: { id: orderId },
      status: TransactionStatus.PENDING,
    });
    await this.transactionRepository.save(transaction);

    // Call Paystack to initialize payment
    const response = await this.paystackService.initializeTransaction(
      amount,
      email,
      reference,
    );

    return {
      authorizationUrl: response.data.authorization_url,
      reference: response.data.reference,
    };
  }

  async verifyPayment(reference: string): Promise<any> {
    const response = await this.paystackService.verifyTransaction(reference);
    if (response.data.status === 'success') {
      // Update transaction status
      await this.transactionRepository.update(
        { referenceId: reference },
        { status: TransactionStatus.COMPLETED },
      );
      return { status: TransactionStatus.COMPLETED };
    } else {
      await this.transactionRepository.update(
        { referenceId: reference },
        { status: TransactionStatus.FAILED },
      );
      throw new BadRequestException('Payment verification failed');
    }
  }
}
