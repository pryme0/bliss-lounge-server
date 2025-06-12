import { Inventory } from '../../inventory/entities/inventory.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InventoryUnitEnum {
  KG = 'kg',
  LITERS = 'liters',
  PIECES = 'pieces',
}

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  menuItemId: string;

  @Column()
  inventoryId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number; // Quantity of the inventory item required (e.g., 0.2 kg of flour)

  @Column({
    type: 'enum',
    enum: InventoryUnitEnum,
    default: InventoryUnitEnum.KG,
  })
  unit?: string; // Unit of measurement (e.g., kg, liters, pieces)

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.recipes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  @ManyToOne(() => Inventory, (inventory) => inventory.recipes, {
    onDelete: 'RESTRICT', // Prevent deleting inventory items used in recipes
  })
  @JoinColumn({ name: 'inventoryId' })
  inventory: Inventory;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
