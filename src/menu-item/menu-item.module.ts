import { Module } from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { MenuItemController } from './menu-item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { SupabaseProvider } from 'src/supabase';
import { Admin } from 'src/admin/entities/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem, Inventory, Admin])],
  controllers: [MenuItemController],
  providers: [SupabaseProvider, MenuItemService],
})
export class MenuItemModule {}
