import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reseller } from './reseller.entity';
import { ResellerClient } from './reseller-client.entity';
import { Commission, CommissionStatus } from './commission.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ResellerService {
  constructor(
    @InjectRepository(Reseller) private resellerRepo: Repository<Reseller>,
    @InjectRepository(ResellerClient) private clientRepo: Repository<ResellerClient>,
    @InjectRepository(Commission) private commissionRepo: Repository<Commission>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  // ── Criar reseller ──────────────────────────────────────────────
  async create(ownerId: string, dto: any): Promise<Reseller> {
    const existing = await this.resellerRepo.findOne({ where: { ownerId } });
    if (existing) throw new BadRequestException('Você já possui um painel de revendedor.');

    const reseller = this.resellerRepo.create({
      ownerId,
      slug: dto.slug,
      brandName: dto.brandName,
      logo: dto.logo,
      primaryColor: dto.primaryColor || '#6366f1',
      maxClients: dto.maxClients || 10,
      maxBotsPerClient: dto.maxBotsPerClient || 3,
      commissionPct: dto.commissionPct || 20,
    });
    return this.resellerRepo.save(reseller);
  }

  // ── Obter reseller do dono ──────────────────────────────────────
  async getByOwner(ownerId: string): Promise<Reseller> {
    const r = await this.resellerRepo.findOne({ where: { ownerId } });
    if (!r) throw new NotFoundException('Reseller não encontrado.');
    return r;
  }

  // ── Atualizar configurações ─────────────────────────────────────
  async update(ownerId: string, dto: any): Promise<Reseller> {
    const reseller = await this.getByOwner(ownerId);
    Object.assign(reseller, dto);
    return this.resellerRepo.save(reseller);
  }

  // ── Adicionar cliente ───────────────────────────────────────────
  async addClient(ownerId: string, dto: { email: string; maxBots: number; monthlyPrice: number }) {
    const reseller = await this.getByOwner(ownerId);

    const count = await this.clientRepo.count({ where: { resellerId: reseller.id, active: true } });
    if (count >= reseller.maxClients)
      throw new BadRequestException(`Limite de ${reseller.maxClients} clientes atingido.`);

    // Criar ou encontrar usuário do cliente
    let clientUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!clientUser) {
      const tempPass = Math.random().toString(36).slice(-10);
      clientUser = this.userRepo.create({
        name: dto.email.split('@')[0],
        email: dto.email,
        passwordHash: tempPass, // será trocada no primeiro login
        plan: 'free' as any,
      });
      await this.userRepo.save(clientUser);
    }

    const already = await this.clientRepo.findOne({
      where: { resellerId: reseller.id, clientUserId: clientUser.id },
    });
    if (already) throw new BadRequestException('Cliente já cadastrado neste reseller.');

    const client = this.clientRepo.create({
      resellerId: reseller.id,
      clientUserId: clientUser.id,
      maxBots: dto.maxBots,
      monthlyPrice: dto.monthlyPrice,
    });
    return this.clientRepo.save(client);
  }

  // ── Listar clientes ─────────────────────────────────────────────
  async listClients(ownerId: string) {
    const reseller = await this.getByOwner(ownerId);
    return this.clientRepo.find({
      where: { resellerId: reseller.id },
      relations: ['clientUser'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── Remover/inativar cliente ────────────────────────────────────
  async removeClient(ownerId: string, clientId: string) {
    const reseller = await this.getByOwner(ownerId);
    const client = await this.clientRepo.findOne({
      where: { id: clientId, resellerId: reseller.id },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado.');
    client.active = false;
    return this.clientRepo.save(client);
  }

  // ── Registrar comissão ──────────────────────────────────────────
  async registerCommission(resellerId: string, clientUserId: string, paymentRef: string, grossAmount: number) {
    const reseller = await this.resellerRepo.findOne({ where: { id: resellerId } });
    if (!reseller) return;

    const amount = (grossAmount * reseller.commissionPct) / 100;
    const commission = this.commissionRepo.create({
      resellerId,
      clientUserId,
      paymentRef,
      amount,
      status: CommissionStatus.PENDING,
    });
    return this.commissionRepo.save(commission);
  }

  // ── Listar comissões ────────────────────────────────────────────
  async listCommissions(ownerId: string) {
    const reseller = await this.getByOwner(ownerId);
    return this.commissionRepo.find({
      where: { resellerId: reseller.id },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Dashboard resumo ────────────────────────────────────────────
  async getDashboard(ownerId: string) {
    const reseller = await this.getByOwner(ownerId);
    const totalClients = await this.clientRepo.count({ where: { resellerId: reseller.id, active: true } });
    const commissions = await this.commissionRepo.find({ where: { resellerId: reseller.id } });
    const totalEarned = commissions
      .filter(c => c.status === CommissionStatus.PAID)
      .reduce((s, c) => s + Number(c.amount), 0);
    const pendingEarned = commissions
      .filter(c => c.status === CommissionStatus.PENDING)
      .reduce((s, c) => s + Number(c.amount), 0);

    return {
      reseller,
      totalClients,
      maxClients: reseller.maxClients,
      totalEarned,
      pendingEarned,
      commissionPct: reseller.commissionPct,
    };
  }
}
