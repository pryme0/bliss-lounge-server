import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionStatus,
} from 'src/dto';
import { Order } from 'src/orders/entities/order.entity';
import { Repository, EntityManager } from 'typeorm';
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
    options: { transactionalEntityManager?: EntityManager } = {},
  ): Promise<Transaction> {
    const { transactionalEntityManager } = options;
    const manager =
      transactionalEntityManager || this.transactionRepository.manager;
    const { orderId, amount, paymentMethod } = createTransactionDto;

    const order = await manager.findOne(Order, {
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const uniqueSuffix = uuidv4().slice(0, 8);
    const referenceId = `${orderId}-${uniqueSuffix}`;

    const transaction = manager.create(Transaction, {
      amount,
      paymentMethod,
      status: TransactionStatus.PENDING,
      order,
      referenceId,
    });

    return manager.save(transaction);
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
    origin: string,
    amount: number,
    email: string,
    orderId: string,
    transaction: Transaction,
  ): Promise<any> {
    const reference = transaction.referenceId;

    try {
      const response = await this.paystackService.initializeTransaction(
        `${origin}/checkout/success`,
        amount,
        email,
        reference,
      );

      return {
        authorizationUrl: response.data.authorization_url,
        access_code: response.data.access_code,
        reference: response.data.reference,
      };
    } catch (error) {
      await this.transactionRepository.update(
        { referenceId: reference },
        { status: TransactionStatus.FAILED },
      );
      throw new InternalServerErrorException(
        `Failed to initialize payment: ${error.message}`,
      );
    }
  }

  async verifyPayment(reference: string): Promise<any> {
    const response = await this.paystackService.verifyTransaction(reference);
    if (response.data.status === 'success') {
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
