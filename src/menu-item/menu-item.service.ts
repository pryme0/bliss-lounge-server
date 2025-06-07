import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateMenuItemDto,
  PaginationQueryDto,
  UpdateMenuItemDto,
} from 'src/dto';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { Repository, In, ILike } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from 'src/supabase';
import { Category } from 'src/category/entities/category.entity';

@Injectable()
export class MenuItemService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
  ) {}

  async create(
    input: CreateMenuItemDto,
    image?: Express.Multer.File,
  ): Promise<MenuItem> {
    try {
      const existingItem = await this.menuItemRepository.findOne({
        where: { name: input.name },
      });
      if (existingItem) {
        throw new BadRequestException(
          `Menu item with name "${input.name}" already exists.`,
        );
      }

      // Check if category exists
      const category = await this.categoryRepository.findOne({
        where: { id: input.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Category with ID "${input.categoryId}" not found.`,
        );
      }

      let imageUrl: string | undefined;
      if (image) {
        const filePath = `images/${Date.now()}_${image.originalname}`;
        const { data, error } = await this.supabaseClient.storage
          .from('menu-items')
          .upload(filePath, image.buffer, {
            contentType: image.mimetype,
          });

        if (error) {
          console.log({ error });
          throw new InternalServerErrorException('Failed to upload image');
        }

        const { data: publicUrlData } = this.supabaseClient.storage
          .from('menu-items')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData?.publicUrl;
      }

      const menuItem = this.menuItemRepository.create({
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl,
        isAvailable: input.isAvailable ?? true,
        category,
      });

      return this.menuItemRepository.save(menuItem);
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: PaginationQueryDto): Promise<MenuItem[]> {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Text search on 'name'
    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    return this.menuItemRepository.find({
      where,
      relations: ['category'],
      skip,
      take: limit,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<MenuItem> {
    const item = await this.menuItemRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!item) {
      throw new NotFoundException(`Menu item with ID "${id}" not found.`);
    }
    return item;
  }

  async update(
    id: string,
    updateMenuItemDto: UpdateMenuItemDto,
    image?: Express.Multer.File,
  ): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID "${id}" not found.`);
    }

    // Check for duplicate name
    if (updateMenuItemDto.name && updateMenuItemDto.name !== menuItem.name) {
      const existingItem = await this.menuItemRepository.findOne({
        where: { name: updateMenuItemDto.name },
      });
      if (existingItem) {
        throw new BadRequestException(
          `Menu item with name "${updateMenuItemDto.name}" already exists.`,
        );
      }
    }

    // Check if new category exists (if provided)
    if (updateMenuItemDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateMenuItemDto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Category with ID "${updateMenuItemDto.categoryId}" not found.`,
        );
      }
      menuItem.category = category;
    }

    // Handle image update if necessary
    if (image) {
      const filePath = `images/${Date.now()}_${(updateMenuItemDto as any).image.originalname}`;
      const { data, error } = await this.supabaseClient.storage
        .from('menu-items')
        .upload(filePath, (updateMenuItemDto as any).image.buffer, {
          contentType: (updateMenuItemDto as any).image.mimetype,
        });

      if (error) {
        throw new InternalServerErrorException('Failed to upload image');
      }

      const { data: publicUrlData } = this.supabaseClient.storage
        .from('menu-items')
        .getPublicUrl(filePath);

      menuItem.imageUrl = publicUrlData?.publicUrl;
    }

    Object.assign(menuItem, updateMenuItemDto);

    return this.menuItemRepository.save(menuItem);
  }

  async remove(id: string): Promise<void> {
    const result = await this.menuItemRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Menu item with ID "${id}" not found.`);
    }
  }
}
