import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/customers/entities/customer.entity';
import { EmailModule } from 'src/utils';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
