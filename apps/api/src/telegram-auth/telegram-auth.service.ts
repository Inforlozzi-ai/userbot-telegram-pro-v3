import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bot } from '../bots/bot.entity';
import { ProvisionerService } from '../provisioner/provisioner.service';
import { Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

const SCRIPT = path.resolve(__dirname, '../../scripts/tg_auth.py');

// Armazena hash+session temporarios entre send e verify
const pending = new Map<string, { phoneCodeHash: string; sessionTmp: string }>();

function runPython(env: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [SCRIPT], {
      env: { ...process.env, ...env },
    });
    let out = '';
    let err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', code => {
      if (code !== 0 && !out.includes('SESSION:') && !out.includes('NEED_2FA')) {
        reject(new Error(err || `Python saiu com codigo ${code}`));
      } else {
        resolve(out);
      }
    });
  });
}

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

    this.logger.log(`Enviando SMS para bot ${botId} (${bot.phoneNumber})...`);

    let output: string;
    try {
      output = await runPython({
        ACTION: 'send',
        API_ID: bot.apiId,
        API_HASH: bot.apiHash,
        PHONE: bot.phoneNumber,
      });
    } catch (e: any) {
      throw new BadRequestException('Erro ao enviar SMS: ' + e.message);
    }

    const hashLine    = output.split('\n').find(l => l.startsWith('HASH:'));
    const sessionLine = output.split('\n').find(l => l.startsWith('SESSION:'));

    if (!hashLine || !sessionLine) {
      throw new BadRequestException('Resposta inesperada do script Python.');
    }

    const phoneCodeHash = hashLine.replace('HASH:', '').trim();
    const sessionTmp    = sessionLine.replace('SESSION:', '').trim();

    pending.set(botId, { phoneCodeHash, sessionTmp });
    await this.botRepo.update(botId, { status: 'provisioning' });

    this.logger.log(`SMS enviado para bot ${botId}`);
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

    const p = pending.get(botId);
    if (!p) throw new BadRequestException('Inicie a autenticacao primeiro (/auth/start).');

    let output: string;
    try {
      output = await runPython({
        ACTION: 'verify',
        API_ID: bot.apiId,
        API_HASH: bot.apiHash,
        PHONE: bot.phoneNumber,
        CODE: code,
        PHONE_CODE_HASH: p.phoneCodeHash,
        SESSION_STRING: p.sessionTmp,
        ...(password ? { PASSWORD: password } : {}),
      });
    } catch (e: any) {
      throw new BadRequestException('Erro ao verificar codigo: ' + e.message);
    }

    if (output.includes('NEED_2FA')) {
      throw new BadRequestException('SESSION_PASSWORD_NEEDED: conta com 2FA, envie o campo password.');
    }

    const sessionLine = output.split('\n').find(l => l.startsWith('SESSION:'));
    if (!sessionLine) {
      throw new BadRequestException('Codigo invalido ou expirado.');
    }

    const sessionString = sessionLine.replace('SESSION:', '').trim();
    pending.delete(botId);

    await this.botRepo.update(botId, { sessionString, status: 'provisioning' });
    const freshBot = await this.botRepo.findOne({ where: { id: botId } });

    this.provisioner.provision(freshBot).then(async (containerId) => {
      await this.botRepo.update(botId, { containerId, status: 'running' });
    }).catch(async () => {
      await this.botRepo.update(botId, { status: 'error' });
    });

    this.logger.log(`Bot ${botId} autenticado com Telethon e provisionado.`);
    return { message: 'Autenticado! Container sendo iniciado...' };
  }
}
