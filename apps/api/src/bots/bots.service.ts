import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bot } from './bot.entity';
import { ProvisionerService } from '../provisioner/provisioner.service';

@Injectable()
export class BotsService {
  constructor(
    @InjectRepository(Bot) private repo: Repository<Bot>,
    private provisioner: ProvisionerService,
  ) {}

  async findByUser(userId: string): Promise<Bot[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<Bot> {
    const bot = await this.repo.findOne({ where: { id } });
    if (!bot) throw new NotFoundException('Bot não encontrado.');
    if (bot.userId !== userId) throw new ForbiddenException();
    return bot;
  }

  async create(userId: string, name: string): Promise<Bot> {
    const slug = `bot-${Date.now()}`;
    const bot = this.repo.create({ userId, name, slug, status: 'provisioning' });
    const saved = await this.repo.save(bot);
    this.provisioner.provision(saved.id).catch(() =>
      this.repo.update(saved.id, { status: 'error' })
    );
    return saved;
  }

  async start(id: string, userId: string): Promise<Bot> {
    const bot = await this.findOne(id, userId);
    await this.provisioner.start(bot.containerId);
    return this.repo.save({ ...bot, status: 'running' });
  }

  async stop(id: string, userId: string): Promise<Bot> {
    const bot = await this.findOne(id, userId);
    await this.provisioner.stop(bot.containerId);
    return this.repo.save({ ...bot, status: 'stopped' });
  }

  async remove(id: string, userId: string): Promise<void> {
    const bot = await this.findOne(id, userId);
    if (bot.containerId) await this.provisioner.remove(bot.containerId).catch(() => {});
    await this.repo.delete(id);
  }

  async updateStatus(id: string, status: Bot['status'], containerId?: string): Promise<void> {
    await this.repo.update(id, { status, ...(containerId ? { containerId } : {}) });
  }
}
