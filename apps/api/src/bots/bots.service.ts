import { Injectable, NotFoundException, ForbiddenException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bot } from './bot.entity';
import { ProvisionerService } from '../provisioner/provisioner.service';

@Injectable()
export class BotsService implements OnModuleInit {
  private readonly logger = new Logger('BotsService');

  constructor(
    @InjectRepository(Bot) private repo: Repository<Bot>,
    private provisioner: ProvisionerService,
  ) {}

  async onModuleInit(): Promise<void> {
    const pending = await this.repo.find({ where: { status: 'provisioning' } });
    if (!pending.length) return;

    this.logger.log(`Encontrados ${pending.length} bot(s) em provisioning para recuperação.`);

    for (const bot of pending) {
      if (!bot.sessionString) {
        this.logger.log(`Bot ${bot.id} ainda não possui sessionString; aguardando autenticação.`);
        continue;
      }

      try {
        await this.repo.update(bot.id, { containerId: null, status: 'provisioning' });
        const containerId = await this.provisioner.provision(bot);
        await this.repo.update(bot.id, { containerId, status: 'running' });
        this.logger.log(`Bot ${bot.id} recuperado com sucesso.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Falha ao recuperar bot ${bot.id}: ${message}`);
        await this.repo.update(bot.id, { status: 'error', containerId: null });
      }
    }
  }

  async findByUser(userId: string): Promise<Bot[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<Bot> {
    const bot = await this.repo.findOne({ where: { id } });
    if (!bot) throw new NotFoundException('Bot não encontrado.');
    if (bot.userId !== userId) throw new ForbiddenException();
    return bot;
  }

  async getConfig(id: string): Promise<Record<string, any>> {
    const bot = await this.repo.findOne({ where: { id } });
    if (!bot) throw new NotFoundException('Bot não encontrado.');
    return bot.config ?? {};
  }

  async saveConfig(id: string, config: Record<string, any>): Promise<{ ok: boolean }> {
    const bot = await this.repo.findOne({ where: { id } });
    if (!bot) throw new NotFoundException('Bot não encontrado.');
    await this.repo.update(id, { config });
    return { ok: true };
  }

  async create(
    userId: string,
    name: string,
    botToken: string,
    phoneNumber: string,
    apiId: string,
    apiHash: string,
  ): Promise<Bot> {
    const slug = `bot-${Date.now()}`;
    const bot = this.repo.create({
      userId, name, slug, status: 'provisioning',
      botToken, phoneNumber, apiId, apiHash,
    });
    const saved = await this.repo.save(bot);

    // Só provisiona se já tiver sessionString.
    // Sem sessão, aguarda o fluxo de auth (telegram-auth.service.ts).
    if (saved.sessionString) {
      this.provisioner.provision(saved).then(async (containerId) => {
        await this.repo.update(saved.id, { containerId, status: 'running' });
      }).catch(async () => {
        await this.repo.update(saved.id, { status: 'error' });
      });
    }

    return saved;
  }

  async start(id: string, userId: string): Promise<Bot> {
    const bot = await this.findOne(id, userId);
    if (!bot.containerId && bot.sessionString) {
      const containerId = await this.provisioner.provision(bot);
      return this.repo.save({ ...bot, containerId, status: 'running' });
    }
    await this.provisioner.start(bot.containerId);
    return this.repo.save({ ...bot, status: 'running' });
  }

  async stop(id: string, userId: string): Promise<Bot> {
    const bot = await this.findOne(id, userId);
    await this.provisioner.stop(bot.containerId);
    return this.repo.save({ ...bot, status: 'stopped' });
  }

  async restart(id: string, userId: string): Promise<Bot> {
    const bot = await this.findOne(id, userId);
    if (!bot.containerId && bot.sessionString) {
      const containerId = await this.provisioner.provision(bot);
      return this.repo.save({ ...bot, containerId, status: 'running' });
    }
    await this.provisioner.stop(bot.containerId).catch(() => {});
    await this.provisioner.start(bot.containerId);
    return this.repo.save({ ...bot, status: 'running' });
  }

  async getLogs(id: string, userId: string): Promise<{ logs: string }> {
    const bot = await this.findOne(id, userId);
    const logs = await this.provisioner.getLogs(bot.containerId);
    return { logs };
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
