import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResellerClient } from '../../reseller/reseller-client.entity';
import { ResellersService } from '../../reseller/reseller.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Controller('webhooks')
export class AsaasWebhookController {
  private readonly logger = new Logger(AsaasWebhookController.name);

  constructor(
    @InjectRepository(ResellerClient)
    private clientRepo: Repository<ResellerClient>,
    private resellersService: ResellersService,
    private notifications: NotificationsService,
  ) {}

  @Post('asaas')
  async handle(
    @Body() body: any,
    @Headers('asaas-access-token') token: string,
  ) {
    if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      throw new UnauthorizedException('Token inválido');
    }
    const event = body.event;
    const payment = body.payment;
    this.logger.log(`Asaas webhook: ${event} | payment: ${payment?.id}`);
    if (!['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(event)) {
      return { ok: true };
    }
    const clientId = payment?.externalReference;
    if (!clientId) return { ok: true };
    const resellerClient = await this.clientRepo.findOne({
      where: { clientId, active: true },
    });
    if (!resellerClient) return { ok: true };
    const grossAmount = Number(payment.value || 0);
    const commissionPct = Number(resellerClient.commissionPct || 20);
    const commissionAmount = (grossAmount * commissionPct) / 100;
    this.logger.log(`Comissão: reseller=${resellerClient.resellerId} | R$${commissionAmount.toFixed(2)}`);
    return { ok: true };
  }
}
