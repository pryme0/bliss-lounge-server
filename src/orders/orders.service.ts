import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './entities/order.entity';

import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import {
  CreateOrderDto,
  CreateOrderResponse,
  PaginationQueryDto,
  PaymentMethod,
  UpdateOrderDto,
} from 'src/dto';
import { TransactionService } from 'src/transactions/transactions.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly transactionService: TransactionService,
  ) {}

  async create(input: CreateOrderDto): Promise<CreateOrderResponse> {
    const { customerId, menuItemIds, totalPrice } = input;

    // Step 1: Validate customer existence
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Step 2: Validate menu items existence
    const menuItems = await this.menuItemRepository.find({
      where: { id: In(menuItemIds) },
    });
    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items not found');
    }

    // Step 3: Calculate server-side total price
    const calculatedTotal = menuItems.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    );
    const isTotalValid = Math.abs(calculatedTotal - totalPrice +1500 ) < 0.01;
    if (!isTotalValid) {
      throw new BadRequestException(
        `Total price mismatch. Expected: ${calculatedTotal.toFixed(2)}`,
      );
    }

    // Step 4: Create and save the order
    const order = this.orderRepository.create({
      customer,
      menuItems,
      totalPrice: calculatedTotal,
    });

    await this.orderRepository.save(order);

    let transaction: Transaction;
    try {
      // Step 5: Create transaction
      transaction = await this.transactionService.create({
        orderId: order.id,
        paymentMethod: PaymentMethod.CARD,
        amount: order.totalPrice,
      });
    } catch (error) {
      // Rollback order if transaction creation fails
      await this.orderRepository.softDelete(order.id);
      throw new InternalServerErrorException(
        `Failed to create transaction: ${error.message || 'Unknown error'}`,
      );
    }

    let payment: any;
    try {
      // Step 6: Initialize payment with Paystack
      payment = await this.transactionService.initializePayment(
        transaction.amount,
        order.customer.email,
        order.id,
      );
    } catch (error) {
      // Rollback transaction and order if payment initialization fails
      await this.transactionService.remove(transaction.id);
      await this.orderRepository.softDelete(order.id);
      throw new InternalServerErrorException(
        `Failed to initialize payment: ${error.message || 'Unknown error'}`,
      );
    }

    // Step 7: Return payment information
    return payment;
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<{ data: Order[]; total: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const [data, total] = await this.orderRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['menuItems', 'customer', 'transactions'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (updateOrderDto.menuItemIds) {
      const menuItems = await this.menuItemRepository.find({
        where: { id: In(updateOrderDto.menuItemIds) },
      });
      if (menuItems.length !== updateOrderDto.menuItemIds.length) {
        throw new BadRequestException('One or more menu items not found');
      }
      order.menuItems = menuItems;
    }

    if (updateOrderDto.status) {
      order.status = updateOrderDto.status;
    }

    return this.orderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }
}
