import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export type UserRole = 'admin' | 'reseller' | 'client';
export type UserPlan = 'free' | 'starter' | 'pro' | 'agency';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', default: 'client' })
  role: UserRole;

  @Column({ type: 'varchar', default: 'free' })
  plan: UserPlan;

  @Column({ nullable: true })
  resellerId: string;

  @Column({ nullable: true })
  asaasCustomerId: string;

  @Column({ nullable: true })
  asaasSubscriptionId: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
