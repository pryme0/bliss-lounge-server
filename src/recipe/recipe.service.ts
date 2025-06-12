import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRecipeDto, RecipeResponseDto, UpdateRecipeDto } from 'src/dto';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(MenuItem)
    private menuItemRepository: Repository<MenuItem>,
  ) {}

  async createRecipe(
    dto: CreateRecipeDto,
    options: { transactionalEntityManager?: EntityManager } = {},
  ): Promise<RecipeResponseDto> {
    const { transactionalEntityManager } = options;
    const manager = transactionalEntityManager || this.recipeRepository.manager;

    // Validate MenuItem exists
    const menuItem = await manager.findOne(MenuItem, {
      where: { id: dto.menuItemId },
    });
    if (!menuItem) {
      throw new NotFoundException(
        `MenuItem with ID ${dto.menuItemId} not found`,
      );
    }

    // Validate Inventory exists and is not soft-deleted
    const inventory = await manager.findOne(Inventory, {
      where: { id: dto.inventoryId, deletedAt: null },
    });
    if (!inventory) {
      throw new NotFoundException(
        `Inventory with ID ${dto.inventoryId} not found or is deleted`,
      );
    }

    // Validate unit matches inventory unit
    if (dto.unit && dto.unit !== inventory.unit) {
      throw new BadRequestException(
        `Unit ${dto.unit} does not match inventory unit ${inventory.unit}`,
      );
    }

    // Check for duplicate recipe
    const existingRecipe = await manager.findOne(Recipe, {
      where: { menuItemId: dto.menuItemId, inventoryId: dto.inventoryId },
    });
    if (existingRecipe) {
      throw new BadRequestException(
        `Recipe for MenuItem ${dto.menuItemId} and Inventory ${dto.inventoryId} already exists`,
      );
    }

    // Create and save recipe
    const recipe = manager.create(Recipe, {
      ...dto,
      unit: dto.unit || inventory.unit,
    });
    const savedRecipe = await manager.save(recipe);

    return {
      id: savedRecipe.id,
      menuItemId: savedRecipe.menuItemId,
      inventoryId: savedRecipe.inventoryId,
      quantity: savedRecipe.quantity,
      unit: savedRecipe.unit,
      createdAt: savedRecipe.createdAt,
    };
  }

  async createRecipeForMenuItem(
    dto: CreateRecipeDto,
    manager: EntityManager,
  ): Promise<RecipeResponseDto> {
    // Validate MenuItem exists
    const menuItem = await manager.findOne(MenuItem, {
      where: { id: dto.menuItemId },
    });
    if (!menuItem) {
      throw new NotFoundException(
        `MenuItem with ID ${dto.menuItemId} not found`,
      );
    }

    // Validate Inventory exists and is not soft-deleted
    const inventory = await manager.findOne(Inventory, {
      where: { id: dto.inventoryId, deletedAt: IsNull() },
    });
    if (!inventory) {
      throw new NotFoundException(
        `Inventory with ID ${dto.inventoryId} not found or is deleted`,
      );
    }

    // Validate unit matches inventory unit
    if (dto.unit && dto.unit !== inventory.unit) {
      throw new BadRequestException(
        `Unit ${dto.unit} does not match inventory unit ${inventory.unit} for ${inventory.itemName}`,
      );
    }

    // Check for duplicate recipe
    const existingRecipe = await manager.findOne(Recipe, {
      where: { menuItemId: dto.menuItemId, inventoryId: dto.inventoryId },
    });
    if (existingRecipe) {
      throw new BadRequestException(
        `Recipe for MenuItem ${dto.menuItemId} and Inventory ${dto.inventoryId} already exists`,
      );
    }

    // Create recipe
    const recipe = manager.create(Recipe, {
      menuItemId: dto.menuItemId,
      inventoryId: dto.inventoryId,
      menuItem,
      inventory,
      quantity: dto.quantity,
      unit: dto.unit || inventory.unit,
    });

    const savedRecipe = await manager.save(recipe);

    return {
      id: savedRecipe.id,
      menuItemId: savedRecipe.menuItemId,
      inventoryId: savedRecipe.inventoryId,
      quantity: savedRecipe.quantity,
      unit: savedRecipe.unit,
      createdAt: savedRecipe.createdAt,
    };
  }

  async findRecipesByMenuItem(
    menuItemId: string,
  ): Promise<RecipeResponseDto[]> {
    const menuItem = await this.menuItemRepository.findOne({
      where: { id: menuItemId },
    });
    if (!menuItem) {
      throw new NotFoundException(`MenuItem with ID ${menuItemId} not found`);
    }

    const recipes = await this.recipeRepository.find({
      where: { menuItemId },
      relations: ['inventory'],
    });

    return recipes.map((recipe) => ({
      id: recipe.id,
      menuItemId: recipe.menuItemId,
      inventoryId: recipe.inventoryId,
      quantity: recipe.quantity,
      unit: recipe.unit,
      createdAt: recipe.createdAt,
    }));
  }

  async updateRecipe(
    id: string,
    dto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    const recipe = await this.recipeRepository.findOne({
      where: { id },
      relations: ['inventory'],
    });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    if (dto.unit && dto.unit !== recipe.inventory.unit) {
      throw new BadRequestException(
        `Unit ${dto.unit} does not match inventory unit ${recipe.inventory.unit}`,
      );
    }

    Object.assign(recipe, {
      quantity: dto.quantity ?? recipe.quantity,
      unit: dto.unit ?? recipe.unit,
    });

    const updatedRecipe = await this.recipeRepository.save(recipe);

    return {
      id: updatedRecipe.id,
      menuItemId: updatedRecipe.menuItemId,
      inventoryId: updatedRecipe.inventoryId,
      quantity: updatedRecipe.quantity,
      unit: updatedRecipe.unit,
      createdAt: updatedRecipe.createdAt,
    };
  }

  async deleteRecipe(id: string): Promise<void> {
    const recipe = await this.recipeRepository.findOne({ where: { id } });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }

    await this.recipeRepository.remove(recipe);
  }

  async checkMenuItemAvailability(
    menuItemId: string,
    options: { transactionalEntityManager?: EntityManager } = {},
  ): Promise<boolean> {
    const { transactionalEntityManager } = options;
    const manager = transactionalEntityManager || this.recipeRepository.manager;

    const recipes = await manager.find(Recipe, {
      where: { menuItemId },
      relations: ['inventory'],
    });

    for (const recipe of recipes) {
      if (!recipe.inventory || recipe.inventory.deletedAt) {
        return false;
      }
      if (recipe.inventory.quantity < recipe.quantity) {
        return false;
      }
    }

    return recipes.length > 0;
  }
}
