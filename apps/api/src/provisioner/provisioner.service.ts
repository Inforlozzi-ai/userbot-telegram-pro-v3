import { Injectable, Logger } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import { Bot } from '../bots/bot.entity';

const PROMPT_IMAGEM = (
  'banner de futebol, filme ou serie de TV. Inclui escudos de times, ' +
  'cartazes de filmes, capas de series, jogadores, estadios ou qualquer ' +
  'imagem relacionada a esporte futebol, cinema ou streaming.'
);

const PROMPT_TEXTO = (
  'A mensagem a seguir e sobre futebol, filmes ou series de TV? ' +
  'Responda apenas SIM ou NAO.\n\nMensagem: {texto}'
);

@Injectable()
export class ProvisionerService {
  private docker = new Dockerode({ socketPath: '/var/run/docker.sock' });
  private logger = new Logger('ProvisionerService');

  async provision(bot: Bot): Promise<string> {
    const image = process.env.DOCKER_IMAGE || 'inforlozzi/userbot-v3:latest';
    this.logger.log(`Provisionando container para bot ${bot.id} (${bot.name})...`);

    // Remove container antigo se existir
    try {
      const old = this.docker.getContainer(`bot-${bot.id}`);
      await old.stop().catch(() => {});
      await old.remove({ force: true }).catch(() => {});
    } catch {}

    const filtroAtivo = (bot as any).filtroTemas !== false;
    const openaiKey  = (bot as any).openaiApiKey || '';

    const env = [
      `BOT_ID=${bot.id}`,
      `BOT_NAME=${bot.name}`,
      `BOT_NOME=${bot.name}`,
      `BOT_TOKEN=${bot.botToken || ''}`,
      `PHONE_NUMBER=${bot.phoneNumber || ''}`,
      `API_ID=${bot.apiId || ''}`,
      `API_HASH=${bot.apiHash || ''}`,
      `SESSION_STRING=${bot.sessionString || ''}`,
      `ADMIN_IDS=${(bot as any).adminIds || ''}`,
      `OPENAI_API_KEY=${openaiKey}`,
      `API_URL=http://api:3001`,
      `CRYPTO_KEY=${process.env.CRYPTO_KEY || ''}`,
      `DATABASE_URL=${process.env.DATABASE_URL}`,
      // Filtro IA fixo: futebol, filmes, series
      `IA_FILTRO_TEMAS_ATIVO=${filtroAtivo ? 'true' : 'false'}`,
      `IA_IMG_ANALISE_PROMPT=${PROMPT_IMAGEM}`,
      `IA_TEXTO_FILTRO_PROMPT=${PROMPT_TEXTO}`,
      `FORWARD_MODE=copy`,
    ];

    const container = await this.docker.createContainer({
      Image: image,
      name: `bot-${bot.id}`,
      Env: env,
      HostConfig: {
        RestartPolicy: { Name: 'unless-stopped' },
        NetworkMode: 'minha_rede',
      },
    });

    await container.start();
    const info = await container.inspect();
    return info.Id;
  }

  async start(containerId: string): Promise<void> {
    if (!containerId) return;
    const c = this.docker.getContainer(containerId);
    await c.start().catch(() => {});
  }

  async stop(containerId: string): Promise<void> {
    if (!containerId) return;
    const c = this.docker.getContainer(containerId);
    await c.stop().catch(() => {});
  }

  async remove(containerId: string): Promise<void> {
    if (!containerId) return;
    const c = this.docker.getContainer(containerId);
    await c.stop().catch(() => {});
    await c.remove({ force: true }).catch(() => {});
  }

  async getLogs(containerId: string): Promise<string> {
    if (!containerId) return 'Container ainda nao provisionado.';
    try {
      const c = this.docker.getContainer(containerId);
      const stream = await c.logs({ stdout: true, stderr: true, tail: 100 });
      return stream.toString('utf8').replace(/[\x00-\x08\x0e-\x1f]/g, '');
    } catch {
      return 'Erro ao buscar logs.';
    }
  }
}
