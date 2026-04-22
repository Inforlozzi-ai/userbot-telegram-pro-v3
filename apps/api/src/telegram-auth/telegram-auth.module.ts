import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bot } from '../bots/bot.entity';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramAuthController } from './telegram-auth.controller';
import { ProvisionerModule } from '../provisioner/provisioner.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bot]), ProvisionerModule],
  providers: [TelegramAuthService],
  controllers: [TelegramAuthController],
})
export class TelegramAuthModule {}
