import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RecipeService } from './recipe.service';

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RecipeResponseDto, CreateRecipeDto, UpdateRecipeDto } from 'src/dto';

@ApiTags('Recipes')
@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recipe for a menu item' })
  @ApiResponse({
    status: 201,
    description: 'Recipe created successfully',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'MenuItem or Inventory not found',
    type: NotFoundException,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or duplicate recipe',
    type: BadRequestException,
  })
  @ApiBody({ type: CreateRecipeDto })
  async create(
    @Body() createRecipeDto: CreateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipeService.createRecipe(createRecipeDto);
  }

  @Get('menu-item/:menuItemId')
  @ApiOperation({ summary: 'Get all recipes for a menu item' })
  @ApiParam({
    name: 'menuItemId',
    description: 'ID of the menu item',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of recipes',
    type: [RecipeResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'MenuItem not found',
    type: NotFoundException,
  })
  async findByMenuItem(
    @Param('menuItemId') menuItemId: string,
  ): Promise<RecipeResponseDto[]> {
    return this.recipeService.findRecipesByMenuItem(menuItemId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recipe' })
  @ApiParam({ name: 'id', description: 'ID of the recipe', type: String })
  @ApiResponse({
    status: 200,
    description: 'Recipe updated successfully',
    type: RecipeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recipe not found',
    type: NotFoundException,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
    type: BadRequestException,
  })
  @ApiBody({ type: UpdateRecipeDto })
  async update(
    @Param('id') id: string,
    @Body() updateRecipeDto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipeService.updateRecipe(id, updateRecipeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a recipe' })
  @ApiParam({ name: 'id', description: 'ID of the recipe', type: String })
  @ApiResponse({ status: 204, description: 'Recipe deleted successfully' })
  @ApiResponse({
    status: 404,
    description: 'Recipe not found',
    type: NotFoundException,
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.recipeService.deleteRecipe(id);
  }
}
