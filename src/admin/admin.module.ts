import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { EmailModule } from 'src/utils';

@Module({
  imports: [TypeOrmModule.forFeature([Admin]), EmailModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
