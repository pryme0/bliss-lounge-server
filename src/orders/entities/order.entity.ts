// src/orders/order.entity.ts

import { Customer } from 'src/customers/entities/customer.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer, (customer) => customer.orders, { eager: true })
  customer: Customer;

  @ManyToMany(() => MenuItem, { eager: true })
  @JoinTable()
  menuItems: MenuItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @OneToMany(() => Transaction, (transaction) => transaction.order)
  transactions: Transaction[];

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'cancelled';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
