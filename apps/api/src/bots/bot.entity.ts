import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export type BotStatus = 'stopped' | 'running' | 'error' | 'provisioning';

@Entity('bots')
export class Bot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  containerId: string;

  @Column({ type: 'varchar', default: 'stopped' })
  status: BotStatus;

  @Column({ nullable: true })
  sessionString: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  botToken: string;

  @Column({ nullable: true })
  apiId: string;

  @Column({ nullable: true })
  apiHash: string;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
