import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Reseller } from './reseller.entity';

export enum CommissionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('commissions')
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reseller_id' })
  resellerId: string;

  @ManyToOne(() => Reseller)
  @JoinColumn({ name: 'reseller_id' })
  reseller: Reseller;

  @Column({ name: 'client_user_id' })
  clientUserId: string;

  @Column({ name: 'payment_ref' })
  paymentRef: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: CommissionStatus, default: CommissionStatus.PENDING })
  status: CommissionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
