import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';

@Controller('webhooks')
export class BillingWebhookController {
  private logger = new Logger('BillingWebhook');

  @Post('asaas')
  async handle(@Body() body: any, @Headers('asaas-access-token') token: string) {
    if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      throw new UnauthorizedException('Token inválido');
    }
    this.logger.log(`Webhook Asaas: ${body.event}`);
    return { received: true };
  }
}
