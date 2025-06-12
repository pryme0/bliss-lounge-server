import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  PaginatedResponse,
} from 'src/dto';
import { Repository, ILike } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from 'src/supabase';
import { Category } from 'src/category/entities/category.entity';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { RecipeService } from 'src/recipe/recipe.service';

@Injectable()
export class MenuItemService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @Inject(SUPABASE_CLIENT)
    private readonly supabaseClient: SupabaseClient,
    private readonly recipeService: RecipeService,
  ) {}

  async create(
    input: CreateMenuItemDto,
    image?: Express.Multer.File,
  ): Promise<MenuItem> {
    return this.menuItemRepository.manager.transaction(
      async (transactionalEntityManager) => {
        try {
          // Validate menu item name
          const existingItem = await transactionalEntityManager.findOne(
            MenuItem,
            {
              where: { name: input.name },
            },
          );
          if (existingItem) {
            throw new BadRequestException(
              `Menu item with name "${input.name}" already exists.`,
            );
          }

          // Validate category
          const category = await transactionalEntityManager.findOne(Category, {
            where: { id: input.categoryId },
          });
          if (!category) {
            throw new BadRequestException(
              `Category with ID "${input.categoryId}" not found.`,
            );
          }

          // Handle image upload
          let imageUrl: string | undefined;
          if (image) {
            const filePath = `images/${Date.now()}_${image.originalname}`;
            const { data, error } = await this.supabaseClient.storage
              .from('menu-items')
              .upload(filePath, image.buffer, {
                contentType: image.mimetype,
              });

            if (error) {
              throw new InternalServerErrorException('Failed to upload image');
            }

            const { data: publicUrlData } = this.supabaseClient.storage
              .from('menu-items')
              .getPublicUrl(filePath);

            imageUrl = publicUrlData?.publicUrl;
          }

          // Create menu item
          const menuItem = transactionalEntityManager.create(MenuItem, {
            name: input.name,
            description: input.description,
            price: input.price,
            cost: input.cost ?? 0,
            imageUrl,
            isAvailable: false,
            category,
          });

          const savedMenuItem = await transactionalEntityManager.save(menuItem);

          // Debug: Verify savedMenuItem
          const verifyMenuItem = await transactionalEntityManager.findOne(
            MenuItem,
            { where: { id: savedMenuItem.id } },
          );
          if (!verifyMenuItem) {
            throw new InternalServerErrorException(
              `Failed to persist MenuItem with ID ${savedMenuItem.id}`,
            );
          }

          // Create recipes if provided
          let calculatedCost = input.cost ?? 0;
          if (input.recipes && typeof input.recipes === 'string') {
            let parsedRecipes;
            try {
              parsedRecipes = JSON.parse(input.recipes);
              if (!Array.isArray(parsedRecipes)) {
                throw new Error('Recipes must be an array');
              }
            } catch (error) {
              throw new BadRequestException('Invalid recipes format');
            }

            // Validate no duplicate inventory IDs
            const inventoryIds = parsedRecipes.map((r) => r.inventoryId);
            if (new Set(inventoryIds).size !== inventoryIds.length) {
              throw new BadRequestException(
                'Duplicate inventory IDs in recipes',
              );
            }

            for (const recipeDto of parsedRecipes) {
              if (!recipeDto.inventoryId || !recipeDto.quantity) {
                throw new BadRequestException('Invalid recipe data');
              }

              await this.recipeService.createRecipeForMenuItem(
                {
                  menuItemId: savedMenuItem.id,
                  inventoryId: recipeDto.inventoryId,
                  quantity: parseFloat(recipeDto.quantity),
                  unit: recipeDto.unit,
                },
                transactionalEntityManager,
              );
            }

            // Calculate cost based on recipes
            calculatedCost = await this.calculateMenuItemCost(
              savedMenuItem.id,
              transactionalEntityManager,
            );
          }

          // Update cost and availability
          savedMenuItem.cost = calculatedCost;
          savedMenuItem.isAvailable =
            await this.recipeService.checkMenuItemAvailability(
              savedMenuItem.id,
              { transactionalEntityManager },
            );
          return await transactionalEntityManager.save(savedMenuItem);
        } catch (error) {
          console.error('Transaction error:', error);
          throw error;
        }
      },
    );
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoryId?: string,
  ): Promise<PaginatedResponse<MenuItem>> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.menuItemRepository
      .createQueryBuilder('menuItem')
      .leftJoinAndSelect('menuItem.category', 'category')
      .leftJoinAndSelect('menuItem.recipes', 'recipes')
      .leftJoinAndSelect('recipes.inventory', 'inventory')
      .orderBy('menuItem.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      queryBuilder.andWhere('menuItem.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (categoryId) {
      queryBuilder.andWhere('menuItem.categoryId = :categoryId', {
        categoryId,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    // Update availability and cost for each menu item
    for (const item of data) {
      item.cost = await this.calculateMenuItemCost(item.id);
      item.isAvailable = await this.recipeService.checkMenuItemAvailability(
        item.id,
      );
      await this.menuItemRepository.save(item);
    }

    return {
      data,
      total,
      page,
      limit: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<MenuItem> {
    const item = await this.menuItemRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!item) {
      throw new NotFoundException(`Menu item with ID "${id}" not found.`);
    }

    // Update cost and availability
    item.cost = await this.calculateMenuItemCost(id);
    item.isAvailable = await this.recipeService.checkMenuItemAvailability(id);
    await this.menuItemRepository.save(item);

    return item;
  }

  async update(
    id: string,
    input: UpdateMenuItemDto,
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
    if (input.name && input.name !== menuItem.name) {
      const existingItem = await this.menuItemRepository.findOne({
        where: { name: input.name },
      });
      if (existingItem) {
        throw new BadRequestException(
          `Menu item with name "${input.name}" already exists.`,
        );
      }
    }

    // Check if new category exists (if provided)
    if (input.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: input.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Category with ID "${input.categoryId}" not found.`,
        );
      }
      menuItem.category = category;
    }

    // Handle image update
    if (image) {
      const filePath = `images/${Date.now()}_${image.originalname}`;
      const { data, error } = await this.supabaseClient.storage
        .from('menu-items')
        .upload(filePath, image.buffer, {
          contentType: image.mimetype,
        });

      if (error) {
        throw new InternalServerErrorException('Failed to upload image');
      }

      const { data: publicUrlData } = this.supabaseClient.storage
        .from('menu-items')
        .getPublicUrl(filePath);

      menuItem.imageUrl = publicUrlData?.publicUrl;
    }

    // Assign fields
    Object.assign(menuItem, {
      name: input.name ?? menuItem.name,
      description: input.description ?? menuItem.description,
      price: input.price ?? menuItem.price,
      cost: input.cost ?? menuItem.cost,
    });

    // Update cost and availability
    const updatedMenuItem = await this.menuItemRepository.save(menuItem);
    updatedMenuItem.cost = await this.calculateMenuItemCost(id);
    updatedMenuItem.isAvailable =
      await this.recipeService.checkMenuItemAvailability(id);
    return await this.menuItemRepository.save(updatedMenuItem);
  }

  async remove(id: string): Promise<void> {
    const menuItem = await this.menuItemRepository.findOne({ where: { id } });
    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID "${id}" not found.`);
    }

    // Check if menu item has associated recipes
    const recipes = await this.recipeRepository.find({
      where: { menuItemId: id },
    });
    if (recipes.length > 0) {
      throw new ConflictException(
        `Cannot delete menu item with ID ${id} because it is used in ${recipes.length} recipe(s).`,
      );
    }

    await this.menuItemRepository.delete(id);
  }

  async calculateMenuItemCost(
    menuItemId: string,
    entityManager = this.recipeRepository.manager,
  ): Promise<number> {
    const recipes = await entityManager.find(Recipe, {
      where: { menuItemId },
      relations: ['inventory'],
    });

    return recipes.reduce((total, recipe) => {
      if (!recipe.inventory || recipe.inventory.deletedAt) {
        return total; // Skip deleted inventory items
      }
      return total + recipe.quantity * recipe.inventory.unitPrice;
    }, 0);
  }
}
