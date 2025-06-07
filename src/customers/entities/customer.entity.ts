// src/customer/customer.entity.ts

import { Order } from 'src/orders/entities/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column()
  password: string;

  @Column({ type: 'simple-array', nullable: true })
  addresses?: string[];

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @Column({ nullable: true })
  resetPasswordOtp?: string;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  resetPasswordExpires?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
