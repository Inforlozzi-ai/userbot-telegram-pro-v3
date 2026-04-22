import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResellerClient } from '../../reseller/reseller-client.entity';
import { ResellerService } from '../../reseller/reseller.service';
import { TelegramNotifyService } from '../../notifications/telegram-notify.service';

@Controller('webhooks')
export class AsaasWebhookController {
  private readonly logger = new Logger(AsaasWebhookController.name);

  constructor(
    @InjectRepository(ResellerClient)
    private clientRepo: Repository<ResellerClient>,
    private resellerService: ResellerService,
    private telegramNotify: TelegramNotifyService,
  ) {}

  @Post('asaas')
  async handle(
    @Body() body: any,
    @Headers('asaas-access-token') token: string,
  ) {
    // Validar token
    if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      throw new UnauthorizedException('Token inválido');
    }

    const event = body.event;
    const payment = body.payment;

    this.logger.log(`Asaas webhook: ${event} | payment: ${payment?.id}`);

    // Somente processar pagamentos confirmados
    if (!['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(event)) {
      return { ok: true };
    }

    const clientUserId = payment?.externalReference;
    if (!clientUserId) return { ok: true };

    // Verificar se este cliente pertence a algum reseller
    const resellerClient = await this.clientRepo.findOne({
      where: { clientUserId, active: true },
      relations: ['reseller', 'reseller.owner', 'clientUser'],
    });

    if (!resellerClient) return { ok: true };

    const grossAmount = Number(payment.value || 0);

    // Registrar comissão automática
    await this.resellerService.registerCommission(
      resellerClient.resellerId,
      clientUserId,
      payment.id,
      grossAmount,
    );

    const commissionAmount = (grossAmount * Number(resellerClient.reseller.commissionPct)) / 100;

    this.logger.log(
      `Comissão registrada: reseller=${resellerClient.reseller.brandName} | valor=R$${commissionAmount.toFixed(2)}`
    );

    // Notificar revendedor no Telegram
    const ownerTelegramId = (resellerClient.reseller.owner as any)?.adminTelegramId;
    if (ownerTelegramId) {
      await this.telegramNotify.send(
        ownerTelegramId,
        `💰 *Novo pagamento recebido!*\n\n` +
        `👤 Cliente: ${resellerClient.clientUser?.email}\n` +
        `💵 Valor pago: R$ ${grossAmount.toFixed(2)}\n` +
        `🏆 Sua comissão (${resellerClient.reseller.commissionPct}%): *R$ ${commissionAmount.toFixed(2)}*\n\n` +
        `📊 Acesse seu painel para mais detalhes.`,
      );
    }

    return { ok: true };
  }
}
