import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('resellers')
export class Reseller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ unique: true })
  slug: string;

  @Column({ name: 'brand_name' })
  brandName: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ name: 'primary_color', default: '#6366f1' })
  primaryColor: string;

  @Column({ name: 'max_clients', default: 10 })
  maxClients: number;

  @Column({ name: 'max_bots_per_client', default: 3 })
  maxBotsPerClient: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'commission_pct', default: 20 })
  commissionPct: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
