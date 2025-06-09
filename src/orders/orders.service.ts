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
import { OrderItem } from './entities/order-item.entity';

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
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async create(input: {
    customerId: string;
    items: { menuItemId: string; quantity: number }[];
    totalPrice: number;
    deliveryAddress: string;
  }): Promise<CreateOrderResponse> {
    const { customerId, items, totalPrice, deliveryAddress } = input;

    // Validate customer existence
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Extract all menuItemIds from items
    const menuItemIds = items.map((item) => item.menuItemId);

    // Fetch menu items from DB
    const menuItems = await this.menuItemRepository.find({
      where: { id: In(menuItemIds) },
    });
    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items not found');
    }

    // Map menuItems by id for quick access
    const menuItemsMap = new Map(menuItems.map((mi) => [mi.id, mi]));

    // Create orderItems with quantity and price
    const orderItems = items.map(({ menuItemId, quantity }) => {
      const menuItem = menuItemsMap.get(menuItemId)!;
      return {
        menuItem,
        menuItemId,
        quantity,
        price: menuItem.price,
      };
    });

    // Calculate total price from orderItems
    const calculatedTotal = orderItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity + 1500,
      0,
    );

    // Validate total price matches
    const isTotalValid = Math.abs(calculatedTotal - totalPrice) < 0.01;
    if (!isTotalValid) {
      throw new BadRequestException(
        `Total price mismatch. Expected: ${calculatedTotal.toFixed(2)}`,
      );
    }

    // Create order entity with customer and orderItems
    const order = this.orderRepository.create({
      customer,
      orderItems,
      totalPrice: calculatedTotal,
      deliveryAddress,
    });

    await this.orderRepository.save(order);

    let transaction: Transaction;
    try {
      // Create transaction
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
      // Initialize payment with Paystack
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

    // Return payment information
    return payment;
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<{ data: Order[]; total: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    // Build where clause conditionally
    const whereClause: any = {};
    if (query.customerId) {
      whereClause.customer = { id: query.customerId };
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderItems', 'customer', 'transactions'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (updateOrderDto.items) {
      const menuItemIds = updateOrderDto.items.map((item) => item.menuItemId);

      // Fetch menu items to validate and get prices
      const menuItems = await this.menuItemRepository.find({
        where: { id: In(menuItemIds) },
      });

      if (menuItems.length !== menuItemIds.length) {
        throw new BadRequestException('One or more menu items not found');
      }

      const menuItemsMap = new Map(menuItems.map((mi) => [mi.id, mi]));

      // Remove existing orderItems for this order
      await this.orderItemRepository.delete({ order: { id: order.id } });

      // Create new OrderItem entities
      const newOrderItems = updateOrderDto.items.map(
        ({ menuItemId, quantity }) => {
          const menuItem = menuItemsMap.get(menuItemId)!;
          return this.orderItemRepository.create({
            menuItem,
            menuItemId,
            quantity,
            price: menuItem.price,
            order,
            orderId: order.id,
          });
        },
      );

      // Save the new order items
      await this.orderItemRepository.save(newOrderItems);

      // Assign to order
      order.orderItems = newOrderItems;

      // Recalculate total price based on new items
      order.totalPrice = newOrderItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );
    }

    // Update status if provided
    if (updateOrderDto.status) {
      order.status = updateOrderDto.status;
    }

    // Save and return updated order
    return this.orderRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }
}
