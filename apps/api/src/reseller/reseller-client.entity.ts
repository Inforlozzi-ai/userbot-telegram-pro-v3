import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Reseller } from './reseller.entity';
import { User } from '../users/user.entity';

@Entity('reseller_clients')
export class ResellerClient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reseller_id' })
  resellerId: string;

  @ManyToOne(() => Reseller)
  @JoinColumn({ name: 'reseller_id' })
  reseller: Reseller;

  @Column({ name: 'client_user_id' })
  clientUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_user_id' })
  clientUser: User;

  @Column({ name: 'max_bots', default: 1 })
  maxBots: number;

  @Column({ name: 'monthly_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
