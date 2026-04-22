import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsaasService } from './asaas.service';
import { UpgradeController } from './upgrade.controller';
import { AsaasWebhookController } from './webhooks/asaas.webhook';
import { ResellerClient } from '../reseller/reseller-client.entity';
import { ResellerModule } from '../reseller/reseller.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResellerClient]),
    ResellerModule,
    NotificationsModule,
  ],
  providers: [AsaasService],
  controllers: [UpgradeController, AsaasWebhookController],
})
export class BillingModule {}
