import { Injectable, Logger } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import { Bot } from '../bots/bot.entity';

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

    const container = await this.docker.createContainer({
      Image: image,
      name: `bot-${bot.id}`,
      Env: [
        `BOT_ID=${bot.id}`,
        `BOT_NAME=${bot.name}`,
        `BOT_TOKEN=${bot.botToken || ''}`,
        `PHONE_NUMBER=${bot.phoneNumber || ''}`,
        `API_ID=${bot.apiId || ''}`,
        `API_HASH=${bot.apiHash || ''}`,
        `SESSION_STRING=${bot.sessionString || ''}`,
        `API_URL=http://api:3001`,
        `DATABASE_URL=${process.env.DATABASE_URL}`,
      ],
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
