import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/customers/entities/customer.entity';
import { EmailModule } from 'src/utils';
import { JwtAuthGuard, JwtStrategy } from 'src/utils/guard';
import { Admin } from 'src/admin/entities/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Admin]), EmailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
