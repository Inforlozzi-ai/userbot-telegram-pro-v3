import { Module } from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { UpgradeController } from './upgrade.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [AsaasService],
  controllers: [UpgradeController, BillingWebhookController],
  exports: [AsaasService],
})
export class BillingModule {}
