import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reseller } from './reseller.entity';
import { ResellerClient } from './reseller-client.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ResellersService {
  constructor(
    @InjectRepository(Reseller) private resellerRepo: Repository<Reseller>,
    @InjectRepository(ResellerClient) private clientRepo: Repository<ResellerClient>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getOrCreate(userId: string): Promise<Reseller> {
    let reseller = await this.resellerRepo.findOne({ where: { userId } });
    if (!reseller) {
      reseller = this.resellerRepo.create({
        userId,
        slug: `r-${userId.slice(0, 8)}`,
        commissionPct: 20,
      });
      reseller = await this.resellerRepo.save(reseller);
    }
    return reseller;
  }

  async getClients(resellerId: string): Promise<ResellerClient[]> {
    return this.clientRepo.find({
      where: { resellerId },
      relations: ['client'],
    });
  }

  async update(userId: string, data: Partial<Reseller>): Promise<Reseller> {
    const reseller = await this.getOrCreate(userId);
    Object.assign(reseller, data);
    return this.resellerRepo.save(reseller);
  }

  async registerCommission(
    resellerId: string,
    clientId: string,
    paymentId: string,
    grossAmount: number,
  ): Promise<void> {
    const client = await this.clientRepo.findOne({ where: { resellerId, clientId } });
    if (!client) return;
    const commission = (grossAmount * Number(client.commissionPct)) / 100;
    client.totalRevenue = Number(client.totalRevenue) + commission;
    await this.clientRepo.save(client);
  }
}
