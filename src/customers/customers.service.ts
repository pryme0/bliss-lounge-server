import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { ILike, Repository } from 'typeorm';
import { PaginatedResponse } from 'src/dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  create(createCustomerDto: CreateCustomerDto) {
    return 'This action adds a new customer';
  }

  /**
   * Get all customers (paginated)
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedResponse<Customer>> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.customerRepository.findAndCount({
      where: search
        ? [
            { email: ILike(`%${search}%`) },
            { fullName: ILike(`%${search}%`) },
            { phoneNumber: ILike(`%${search}%`) },
          ]
        : {},
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit: Math.ceil(total / limit),
    };
  }

  /**
   * Get single customer by ID
   */
  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return customer;
  }

  /**
   * Update customer
   */
  async update(
    id: string,
    updateAuthDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    Object.assign(customer, updateAuthDto);
    return this.customerRepository.save(customer);
  }

  /**
   * Soft delete customer
   */
  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.softRemove(customer);
  }
}
