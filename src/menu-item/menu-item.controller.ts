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
import { CreateMenuItemDto, UpdateMenuItemDto } from 'src/dto';
import { MenuItem } from './entities/menu-item.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/utils/guard';

@ApiTags('Menu Items')
@Controller('menu-items')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateMenuItemDto })
  create(
    @Body() createMenuItemDto: CreateMenuItemDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ) {
    return this.menuItemService.create(createMenuItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all menu items' })
  @ApiResponse({ status: 200, type: [MenuItem] })
  findAll() {
    return this.menuItemService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a menu item by ID' })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiResponse({ status: 200, type: MenuItem })
  findOne(@Param('id') id: string) {
    return this.menuItemService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a menu item' })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiResponse({ status: 200, type: MenuItem })
  update(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.menuItemService.update(id, updateMenuItemDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a menu item' })
  @ApiParam({ name: 'id', description: 'Menu item ID' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.menuItemService.remove(id);
  }
}
