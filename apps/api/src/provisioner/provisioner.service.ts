import { Injectable, Logger } from '@nestjs/common';
import Docker from 'dockerode';

@Injectable()
export class ProvisionerService {
  private docker = new Docker({ socketPath: '/var/run/docker.sock' });
  private logger = new Logger('ProvisionerService');

  async provision(botId: string): Promise<string> {
    const image = process.env.DOCKER_IMAGE || 'inforlozzi/userbot-v3:latest';
    this.logger.log(`Provisionando container para bot ${botId}...`);
    const container = await this.docker.createContainer({
      Image: image,
      name: `bot-${botId}`,
      Env: [
        `BOT_ID=${botId}`,
        `API_URL=http://api:3001`,
        `DATABASE_URL=${process.env.DATABASE_URL}`,
      ],
      HostConfig: { RestartPolicy: { Name: 'unless-stopped' } },
    });
    await container.start();
    return container.id;
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
    await c.remove().catch(() => {});
  }
}
