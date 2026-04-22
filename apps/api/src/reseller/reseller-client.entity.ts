import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('reseller_clients')
export class ResellerClient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resellerId: string;

  @Column()
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ type: 'decimal', default: 20 })
  commissionPct: number;

  @Column({ type: 'decimal', default: 0 })
  totalRevenue: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
