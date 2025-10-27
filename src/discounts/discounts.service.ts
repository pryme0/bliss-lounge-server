import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Discount,
  DiscountScope,
  DiscountType,
} from './entities/discount.entity';
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  PaginatedResponse,
} from 'src/dto';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
  ) {}

  async create(input: CreateDiscountDto): Promise<Discount> {
    try {
      // Validate percentage discount value
      if (input.type === DiscountType.PERCENTAGE) {
        if (input.value < 0 || input.value > 100) {
          throw new BadRequestException(
            'Percentage discount must be between 0 and 100',
          );
        }
      }

      // Validate dates
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (input.startDate) {
        startDate = new Date(input.startDate);
        if (isNaN(startDate.getTime())) {
          throw new BadRequestException('Invalid start date format');
        }
      }

      if (input.endDate) {
        endDate = new Date(input.endDate);
        if (isNaN(endDate.getTime())) {
          throw new BadRequestException('Invalid end date format');
        }

        if (startDate && endDate < startDate) {
          throw new BadRequestException('End date must be after start date');
        }
      }

      // Validate menu items for SPECIFIC_ITEMS scope
      let menuItems: MenuItem[] = [];
      if (input.scope === DiscountScope.SPECIFIC_ITEMS) {
        if (!input.menuItemIds || input.menuItemIds.length === 0) {
          throw new BadRequestException(
            'Menu item IDs are required for specific items discount',
          );
        }

        menuItems = await this.menuItemRepository.find({
          where: { id: In(input.menuItemIds) },
        });

        if (menuItems.length !== input.menuItemIds.length) {
          throw new BadRequestException('Some menu items not found');
        }
      }

      // Create discount
      const discount = this.discountRepository.create({
        name: input.name,
        description: input.description,
        type: input.type,
        value: input.value,
        scope: input.scope,
        isActive: input.isActive !== undefined ? input.isActive : true,
        startDate,
        endDate,
        menuItems:
          input.scope === DiscountScope.SPECIFIC_ITEMS ? menuItems : [],
      });

      return await this.discountRepository.save(discount);
    } catch (error) {
      console.error('Error creating discount:', error);
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    isActive?: boolean,
    scope?: DiscountScope,
  ): Promise<PaginatedResponse<Discount>> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.discountRepository
      .createQueryBuilder('discount')
      .leftJoinAndSelect('discount.menuItems', 'menuItems')
      .orderBy('discount.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(discount.name ILIKE :search OR discount.description ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('discount.isActive = :isActive', { isActive });
    }

    if (scope) {
      queryBuilder.andWhere('discount.scope = :scope', { scope });
    }

    // Get entities and total count
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id },
      relations: ['menuItems'],
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID "${id}" not found.`);
    }

    return discount;
  }

  async update(id: string, input: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id },
      relations: ['menuItems'],
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID "${id}" not found.`);
    }

    // Validate percentage discount value if type or value is being updated
    const newType = input.type || discount.type;
    const newValue = input.value !== undefined ? input.value : discount.value;

    if (newType === DiscountType.PERCENTAGE) {
      if (newValue < 0 || newValue > 100) {
        throw new BadRequestException(
          'Percentage discount must be between 0 and 100',
        );
      }
    }

    // Validate dates
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (input.startDate) {
      startDate = new Date(input.startDate);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
    }

    if (input.endDate) {
      endDate = new Date(input.endDate);
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }

      const compareStartDate = startDate || discount.startDate;
      if (compareStartDate && endDate < compareStartDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Handle menu items update for SPECIFIC_ITEMS scope
    if (input.scope === DiscountScope.SPECIFIC_ITEMS || discount.scope === DiscountScope.SPECIFIC_ITEMS) {
      if (input.menuItemIds) {
        if (input.menuItemIds.length === 0) {
          throw new BadRequestException(
            'At least one menu item is required for specific items discount',
          );
        }

        const menuItems = await this.menuItemRepository.find({
          where: { id: In(input.menuItemIds) },
        });

        if (menuItems.length !== input.menuItemIds.length) {
          throw new BadRequestException('Some menu items not found');
        }

        discount.menuItems = menuItems;
      }
    } else if (input.scope === DiscountScope.ALL_ITEMS) {
      // Clear menu items if changing to ALL_ITEMS scope
      discount.menuItems = [];
    }

    // Assign fields
    Object.assign(discount, {
      name: input.name ?? discount.name,
      description: input.description ?? discount.description,
      type: input.type ?? discount.type,
      value: input.value !== undefined ? input.value : discount.value,
      scope: input.scope ?? discount.scope,
      isActive: input.isActive !== undefined ? input.isActive : discount.isActive,
      startDate: startDate ?? discount.startDate,
      endDate: endDate ?? discount.endDate,
    });

    return await this.discountRepository.save(discount);
  }

  async remove(id: string): Promise<void> {
    const discount = await this.discountRepository.findOne({ where: { id } });
    if (!discount) {
      throw new NotFoundException(`Discount with ID "${id}" not found.`);
    }

    await this.discountRepository.delete(id);
  }

  async addMenuItems(discountId: string, menuItemIds: string[]): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id: discountId },
      relations: ['menuItems'],
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID "${discountId}" not found.`);
    }

    if (discount.scope !== DiscountScope.SPECIFIC_ITEMS) {
      throw new BadRequestException(
        'Cannot add specific menu items to an ALL_ITEMS discount',
      );
    }

    const menuItems = await this.menuItemRepository.find({
      where: { id: In(menuItemIds) },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('Some menu items not found');
    }

    // Add new items without removing existing ones
    const existingIds = discount.menuItems.map((item) => item.id);
    const newItems = menuItems.filter((item) => !existingIds.includes(item.id));
    discount.menuItems = [...discount.menuItems, ...newItems];

    return await this.discountRepository.save(discount);
  }

  async addAllMenuItems(discountId: string): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id: discountId },
      relations: ['menuItems'],
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID "${discountId}" not found.`);
    }

    if (discount.scope !== DiscountScope.SPECIFIC_ITEMS) {
      throw new BadRequestException(
        'Cannot add specific menu items to an ALL_ITEMS discount. Use ALL_ITEMS scope instead.',
      );
    }

    // Get all menu items
    const allMenuItems = await this.menuItemRepository.find();

    if (allMenuItems.length === 0) {
      throw new BadRequestException('No menu items found in the system');
    }

    // Replace with all menu items (avoiding duplicates)
    discount.menuItems = allMenuItems;

    return await this.discountRepository.save(discount);
  }

  async removeMenuItems(discountId: string, menuItemIds: string[]): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id: discountId },
      relations: ['menuItems'],
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID "${discountId}" not found.`);
    }

    discount.menuItems = discount.menuItems.filter(
      (item) => !menuItemIds.includes(item.id),
    );

    return await this.discountRepository.save(discount);
  }

  async removeAllMenuItems(discountId: string): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id: discountId },
      relations: ['menuItems'],
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID "${discountId}" not found.`);
    }

    if (discount.scope !== DiscountScope.SPECIFIC_ITEMS) {
      throw new BadRequestException(
        'Cannot remove menu items from an ALL_ITEMS discount',
      );
    }

    // Clear all menu items
    discount.menuItems = [];

    return await this.discountRepository.save(discount);
  }

  async getActiveDiscountsForMenuItem(menuItemId: string): Promise<Discount[]> {
    const now = new Date();

    const queryBuilder = this.discountRepository
      .createQueryBuilder('discount')
      .leftJoinAndSelect('discount.menuItems', 'menuItems')
      .where('discount.isActive = :isActive', { isActive: true })
      .andWhere(
        '(discount.startDate IS NULL OR discount.startDate <= :now)',
        { now },
      )
      .andWhere('(discount.endDate IS NULL OR discount.endDate >= :now)', {
        now,
      })
      .andWhere(
        '(discount.scope = :allItems OR menuItems.id = :menuItemId)',
        {
          allItems: DiscountScope.ALL_ITEMS,
          menuItemId,
        },
      );

    return await queryBuilder.getMany();
  }

  calculateDiscountedPrice(
    originalPrice: number,
    discount: Discount,
  ): number {
    if (discount.type === DiscountType.PERCENTAGE) {
      return originalPrice - (originalPrice * discount.value) / 100;
    } else {
      // FIXED_AMOUNT
      return Math.max(0, originalPrice - discount.value);
    }
  }

  async getBestDiscountForMenuItem(menuItemId: string): Promise<{
    discount: Discount | null;
    discountedPrice: number;
    originalPrice: number;
  }> {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID "${menuItemId}" not found.`);
    }

    const activeDiscounts = await this.getActiveDiscountsForMenuItem(menuItemId);

    if (activeDiscounts.length === 0) {
      return {
        discount: null,
        discountedPrice: Number(menuItem.price),
        originalPrice: Number(menuItem.price),
      };
    }

    // Calculate the best discount (lowest final price)
    let bestDiscount = activeDiscounts[0];
    let lowestPrice = this.calculateDiscountedPrice(
      Number(menuItem.price),
      bestDiscount,
    );

    for (const discount of activeDiscounts.slice(1)) {
      const discountedPrice = this.calculateDiscountedPrice(
        Number(menuItem.price),
        discount,
      );
      if (discountedPrice < lowestPrice) {
        lowestPrice = discountedPrice;
        bestDiscount = discount;
      }
    }

    return {
      discount: bestDiscount,
      discountedPrice: lowestPrice,
      originalPrice: Number(menuItem.price),
    };
  }

  async toggleActive(id: string): Promise<Discount> {
    const discount = await this.findOne(id);
    discount.isActive = !discount.isActive;
    return await this.discountRepository.save(discount);
  }
}

