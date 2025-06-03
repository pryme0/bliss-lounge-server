import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './entities/order.entity';

import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { CreateOrderDto, PaginationQueryDto, UpdateOrderDto } from 'src/dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const { customerId, menuItemIds, totalPrice } = createOrderDto;

    // Validate customer existence
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate menu items existence
    const menuItems = await this.menuItemRepository.find({
      where: { id: In(menuItemIds) },
    });
    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items not found');
    }

    // Calculate server-side total price
    const calculatedTotal = menuItems.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    );

    // Optional: allow a small floating point tolerance (e.g. 2 decimal places)
    const isTotalValid = Math.abs(calculatedTotal - totalPrice) < 0.01;
    if (!isTotalValid) {
      throw new BadRequestException(
        `Total price mismatch. Expected: ${calculatedTotal.toFixed(2)}`,
      );
    }

    // Create the order entity
    const order = this.orderRepository.create({
      customer,
      menuItems,
      totalPrice: calculatedTotal,
    });

    return this.orderRepository.save(order);
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
