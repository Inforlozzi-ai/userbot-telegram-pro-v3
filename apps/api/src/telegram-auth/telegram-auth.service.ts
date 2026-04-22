import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bot } from '../bots/bot.entity';
import { ProvisionerService } from '../provisioner/provisioner.service';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Logger } from '@nestjs/common';

// Armazena clientes temporarios em memoria durante o fluxo de auth
const pendingClients = new Map<string, { client: TelegramClient; phoneCodeHash: string }>();

@Injectable()
export class TelegramAuthService {
  private logger = new Logger('TelegramAuthService');

  constructor(
    @InjectRepository(Bot) private botRepo: Repository<Bot>,
    private provisioner: ProvisionerService,
  ) {}

  async startAuth(botId: string, userId: string): Promise<{ message: string }> {
    const bot = await this.botRepo.findOne({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Bot nao encontrado.');
    if (bot.userId !== userId) throw new BadRequestException('Sem permissao.');
    if (!bot.apiId || !bot.apiHash || !bot.phoneNumber) {
      throw new BadRequestException('API ID, API Hash e telefone sao obrigatorios.');
    }

    const session = new StringSession('');
    const client = new TelegramClient(session, parseInt(bot.apiId), bot.apiHash, {
      connectionRetries: 3,
    });

    await client.connect();
    const result = await client.sendCode(
      { apiId: parseInt(bot.apiId), apiHash: bot.apiHash },
      bot.phoneNumber,
    );

    pendingClients.set(botId, { client, phoneCodeHash: result.phoneCodeHash });
    this.logger.log(`Codigo SMS enviado para bot ${botId} (${bot.phoneNumber})`);

    await this.botRepo.update(botId, { status: 'provisioning' });
    return { message: 'Codigo SMS enviado para ' + bot.phoneNumber };
  }

  async verifyCode(
    botId: string,
    userId: string,
    code: string,
    password?: string,
  ): Promise<{ message: string }> {
    const bot = await this.botRepo.findOne({ where: { id: botId } });
    if (!bot) throw new NotFoundException('Bot nao encontrado.');
    if (bot.userId !== userId) throw new BadRequestException('Sem permissao.');

    const pending = pendingClients.get(botId);
    if (!pending) throw new BadRequestException('Inicie a autenticacao primeiro.');

    const { client, phoneCodeHash } = pending;

    try {
      await client.invoke(
        new (require('telegram/tl').Api.auth.SignIn)({
          phoneNumber: bot.phoneNumber,
          phoneCodeHash,
          phoneCode: code,
        })
      );
    } catch (err: any) {
      // Conta com senha de 2 fatores
      if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        if (!password) throw new BadRequestException('Esta conta tem senha de dois fatores. Envie o campo password.');
        const { computeCheck } = require('telegram/Password');
        const srp = await client.invoke(new (require('telegram/tl').Api.account.GetPassword)());
        const srpAnswer = await computeCheck(srp, password);
        await client.invoke(new (require('telegram/tl').Api.auth.CheckPassword)({ password: srpAnswer }));
      } else {
        throw new BadRequestException('Codigo invalido ou expirado: ' + err.errorMessage);
      }
    }

    const sessionString = client.session.save() as unknown as string;
    await client.disconnect();
    pendingClients.delete(botId);

    // Salva session string e provisiona container
    await this.botRepo.update(botId, { sessionString, status: 'provisioning' });
    const freshBot = await this.botRepo.findOne({ where: { id: botId } });

    this.provisioner.provision(freshBot).then(async (containerId) => {
      await this.botRepo.update(botId, { containerId, status: 'running' });
    }).catch(async () => {
      await this.botRepo.update(botId, { status: 'error' });
    });

    this.logger.log(`Bot ${botId} autenticado e provisionado com sucesso.`);
    return { message: 'Autenticado! Container sendo iniciado...' };
  }
}
