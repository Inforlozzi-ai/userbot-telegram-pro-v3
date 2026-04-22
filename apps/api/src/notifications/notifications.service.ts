import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private logger = new Logger('NotificationsService');

  async send(chatId: string, message: string): Promise<void> {
    const token = process.env.NOTIFY_BOT_TOKEN;
    if (!token || !chatId) return;
    try {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      });
    } catch (e) {
      this.logger.warn(`Falha ao enviar notificação Telegram: ${e.message}`);
    }
  }
}
