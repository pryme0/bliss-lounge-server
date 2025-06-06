import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum InventoryUnitEnum {
  KG = 'In-Stock',
  LITERS = 'liters',
  PIECES = 'pieces',
}

export enum InventoryStatusEnum {
  INSTOCK = 'in-stock',
  OUTOFSTOCK = 'out-of-stock',
}

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemName: string;

  @Column('int')
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: InventoryStatusEnum,
    default: InventoryStatusEnum.INSTOCK,
  })
  status?: string;

  @Column({
    type: 'enum',
    enum: InventoryUnitEnum,
    default: InventoryUnitEnum.KG,
  })
  unit?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
