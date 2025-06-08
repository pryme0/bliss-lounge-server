import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import {
  CreateMenuItemDto,
  PaginationQueryDto,
  UpdateMenuItemDto,
} from 'src/dto';
import { MenuItem } from './entities/menu-item.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomJwtAuthGuard } from 'src/utils/guard';

@ApiTags('Menu Items')
@Controller('menu-items')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Post()
  @UseGuards(CustomJwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateMenuItemDto })
  create(
    @Body() createMenuItemDto: CreateMenuItemDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.menuItemService.create(createMenuItemDto, image);
  }

  @Get()
  @ApiOperation({ summary: 'Get all menu items' })
  @ApiResponse({ status: 200, type: [MenuItem] })
  findAll(@Query() query: PaginationQueryDto) {
    return this.menuItemService.findAll(
      parseInt(query.page) || 1,
      parseInt(query.limit) || 10,
      query.search,
      query.categoryId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a menu item by ID' })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiResponse({ status: 200, type: MenuItem })
  findOne(@Param('id') id: string) {
    return this.menuItemService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(CustomJwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update a menu item' })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiResponse({ status: 200, type: MenuItem })
  update(
    @Param('id') id: string,
    @Body() input: any,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    console.log({ input });
    return this.menuItemService.update(id, input, image);
  }

  @Delete(':id')
  @UseGuards(CustomJwtAuthGuard)
  @ApiOperation({ summary: 'Delete a menu item' })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.menuItemService.remove(id);
  }
}
