import { Module, Global } from '@nestjs/common';
import { TelegramNotifyService } from './telegram-notify.service';

@Global()
@Module({
  providers: [TelegramNotifyService],
  exports: [TelegramNotifyService],
})
export class NotificationsModule {}
