import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateInventoryDto,
  PaginationQueryDto,
  UpdateInventoryDto,
} from 'src/dto';
import { ILike, Repository, Not, IsNull } from 'typeorm';
import { Inventory, InventoryStatusEnum } from './entities/inventory.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { RecipeService } from 'src/recipe/recipe.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    private readonly recipeService: RecipeService,
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

    const newItem = this.inventoryRepository.create({
      ...createInventoryDto,
      status:
        createInventoryDto.quantity <= createInventoryDto.minimumStock
          ? InventoryStatusEnum.LOWSTOCK
          : InventoryStatusEnum.INSTOCK,
    });
    const savedItem = await this.inventoryRepository.save(newItem);

    // Update menu item availability if needed
    await this.updateMenuItemAvailability();
    return savedItem;
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

    // Update fields
    Object.assign(item, updateInventoryDto);

    // Update status based on quantity and minimumStock
    const effectiveMinStock =
      updateInventoryDto.minimumStock ?? item.minimumStock;
    if (updateInventoryDto.quantity !== undefined) {
      item.status =
        updateInventoryDto.quantity <= effectiveMinStock
          ? InventoryStatusEnum.LOWSTOCK
          : updateInventoryDto.quantity === 0
            ? InventoryStatusEnum.OUTOFSTOCK
            : InventoryStatusEnum.INSTOCK;
    }

    const updatedItem = await this.inventoryRepository.save(item);

    // Update menu item availability
    await this.updateMenuItemAvailability();
    return updatedItem;
  }

  // Soft Delete Inventory Item
  async softDelete(id: string): Promise<void> {
    const item = await this.findOne(id);

    // Check if inventory item is used in any recipes
    const recipes = await this.recipeRepository.find({
      where: { inventoryId: id },
    });
    if (recipes.length > 0) {
      throw new ConflictException(
        `Cannot delete inventory item with ID ${id} because it is used in ${recipes.length} recipe(s).`,
      );
    }

    await this.inventoryRepository.softRemove(item);
    await this.updateMenuItemAvailability();
  }

  // Helper method to update menu item availability
  private async updateMenuItemAvailability(): Promise<void> {
    const menuItems = await this.menuItemRepository.find();
    for (const menuItem of menuItems) {
      const isAvailable = await this.recipeService.checkMenuItemAvailability(
        menuItem.id,
      );
      if (menuItem.isAvailable !== isAvailable) {
        menuItem.isAvailable = isAvailable;
        await this.menuItemRepository.save(menuItem);
      }
    }
  }
}
