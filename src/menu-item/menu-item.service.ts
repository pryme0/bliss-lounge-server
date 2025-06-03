import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMenuItemDto, UpdateMenuItemDto } from 'src/dto';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { Repository, In } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from 'src/supabase';

@Injectable()
export class MenuItemService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
  ) {}

  async create(createMenuItemDto: CreateMenuItemDto): Promise<MenuItem> {
    // Check if item name already exists
    const existingItem = await this.menuItemRepository.findOne({
      where: { name: createMenuItemDto.name },
    });
    if (existingItem) {
      throw new BadRequestException(
        `Menu item with name "${createMenuItemDto.name}" already exists.`,
      );
    }

    let imageUrl: string | undefined;
    if (createMenuItemDto.image) {
      // Upload image to Supabase
      const filePath = `images/${Date.now()}_${createMenuItemDto.image.originalname}`;
      const { data, error } = await this.supabaseClient.storage
        .from('menu-items')
        .upload(filePath, createMenuItemDto.image.buffer, {
          contentType: createMenuItemDto.image.mimetype,
        });

      if (error) {
        throw new InternalServerErrorException('Failed to upload image');
      }

      // Get public URL
      const { data: publicUrlData } = this.supabaseClient.storage
        .from('menu-items')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData?.publicUrl;
    }

    const menuItem = this.menuItemRepository.create({
      ...createMenuItemDto,
      imageUrl,
    });

    return this.menuItemRepository.save(menuItem);
  }

  async findAll(): Promise<MenuItem[]> {
    return this.menuItemRepository.find({ relations: ['ingredients'] });
  }

  async findOne(id: string): Promise<MenuItem> {
    const item = await this.menuItemRepository.findOne({
      where: { id },
      relations: ['ingredients'],
    });
    if (!item) {
      throw new NotFoundException(`Menu item with ID "${id}" not found.`);
    }
    return item;
  }

  async update(
    id: string,
    updateMenuItemDto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    const menuItem = await this.menuItemRepository.findOne({ where: { id } });
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
