import { Recipe } from 'src/recipe/entities/recipe.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

export enum InventoryUnitEnum {
  KG = 'kg',
  LITERS = 'liters',
  PIECES = 'pieces',
}

export enum InventoryStatusEnum {
  INSTOCK = 'in-stock',
  OUTOFSTOCK = 'out-of-stock',
  LOWSTOCK = 'low-stock', // Added to indicate low inventory levels
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
  status: string;

  @Column({
    type: 'enum',
    enum: InventoryUnitEnum,
    default: InventoryUnitEnum.KG,
  })
  unit: string;

  @Column({ type: 'int', default: 0 }) // Minimum stock level to trigger low-stock status
  minimumStock: number;

  @OneToMany(() => Recipe, (recipe) => recipe.inventory)
  recipes: Recipe[]; // Relationship to Recipe entity

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
