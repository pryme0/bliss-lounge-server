import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateInventoryDto,
  PaginationQueryDto,
  UpdateInventoryDto,
} from 'src/dto';
import { ILike, Repository, Not, IsNull } from 'typeorm';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  // Create Inventory
  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const existingItem = await this.inventoryRepository.findOne({
      where: {
        itemName: ILike(createInventoryDto.itemName),
        deletedAt: IsNull(),
      },
    });
    if (existingItem) {
      throw new BadRequestException(
        `An inventory item with name "${createInventoryDto.itemName}" already exists.`,
      );
    }

    const newItem = this.inventoryRepository.create(createInventoryDto);
    return this.inventoryRepository.save(newItem);
  }

  // Get All Inventory Items (Paginated)
  async findAll(query: PaginationQueryDto) {
    const { page = '1', limit = '10', search } = query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const where = search
      ? [
          { itemName: ILike(`%${search}%`), deletedAt: IsNull() },
          { description: ILike(`%${search}%`), deletedAt: IsNull() },
        ]
      : { deletedAt: IsNull() };

    const [data, total] = await this.inventoryRepository.findAndCount({
      where,
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
      order: { createdAt: 'DESC' },
    });

    return {
      page: pageNum,
      limit: limitNum,
      total,
      data,
    };
  }

  // Get Single Inventory Item
  async findOne(id: string): Promise<Inventory> {
    const item = await this.inventoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found.`);
    }
    return item;
  }

  // Update Inventory Item
  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const item = await this.findOne(id);

    if (
      updateInventoryDto.itemName &&
      updateInventoryDto.itemName.toLowerCase() !== item.itemName.toLowerCase()
    ) {
      const existingItem = await this.inventoryRepository.findOne({
        where: {
          itemName: ILike(updateInventoryDto.itemName),
          id: Not(id),
          deletedAt: IsNull(),
        },
      });
      if (existingItem) {
        throw new BadRequestException(
          `An inventory item with name "${updateInventoryDto.itemName}" already exists.`,
        );
      }
    }

    Object.assign(item, updateInventoryDto);
    return this.inventoryRepository.save(item);
  }

  // Soft Delete Inventory Item
  async softDelete(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.inventoryRepository.softRemove(item);
  }
}
