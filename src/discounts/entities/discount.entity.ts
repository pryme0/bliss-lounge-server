import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

export enum DiscountScope {
  SPECIFIC_ITEMS = 'specific_items',
  ALL_ITEMS = 'all_items',
}

@Entity()
export class Discount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.PERCENTAGE,
  })
  type: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({
    type: 'enum',
    enum: DiscountScope,
    default: DiscountScope.SPECIFIC_ITEMS,
  })
  scope: DiscountScope;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @ManyToMany(() => MenuItem, { cascade: true })
  @JoinTable({
    name: 'discount_menu_items',
    joinColumn: { name: 'discountId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menuItemId', referencedColumnName: 'id' },
  })
  menuItems: MenuItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

