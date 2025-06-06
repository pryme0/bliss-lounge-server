import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class Admin {
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

  @Column({ nullable: true })
  resetPasswordOtp?: string;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  resetPasswordExpires?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
