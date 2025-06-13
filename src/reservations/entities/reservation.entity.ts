import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity()
@Index(['date', 'time', 'email'], { unique: true })
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  date: string; // ISO date, e.g., '2025-06-14'

  @Column()
  time: string; // Time, e.g., '18:30'

  @Column({ type: 'int' })
  guests: number;

  @Column({ nullable: true, length: 500 })
  notes?: string;

  @Column({ nullable: true, length: 500 })
  phoneNumber?: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
