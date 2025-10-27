import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'timestamp' })
  eventDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  eventEndDate?: Date;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ nullable: true })
  organizer?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  ticketPrice?: number;

  @Column({ nullable: true })
  ticketLink?: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

