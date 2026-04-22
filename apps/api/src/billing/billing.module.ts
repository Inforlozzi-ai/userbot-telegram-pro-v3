import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsaasService } from './asaas.service';
import { UpgradeController } from './upgrade.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { AsaasWebhookController } from './webhooks/asaas.webhook';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ResellersModule } from '../reseller/reseller.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ResellerClient } from '../reseller/reseller-client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResellerClient]),
    AuthModule,
    UsersModule,
    ResellersModule,
    NotificationsModule,
  ],
  providers: [AsaasService],
  controllers: [UpgradeController, BillingWebhookController, AsaasWebhookController],
  exports: [AsaasService],
})
export class BillingModule {}
