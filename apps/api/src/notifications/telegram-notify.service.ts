import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramNotifyService {
  private readonly logger = new Logger(TelegramNotifyService.name);
  private readonly botToken = process.env.NOTIFY_BOT_TOKEN;

  /**
   * Envia mensagem Markdown para um chat_id via Bot do Telegram.
   * NOTIFY_BOT_TOKEN = token do bot de notificações (pode ser o mesmo bot principal)
   */
  async send(chatId: string | number, text: string): Promise<void> {
    if (!this.botToken) {
      this.logger.warn('NOTIFY_BOT_TOKEN não configurado — notificações desativadas.');
      return;
    }
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        },
      );
    } catch (err: any) {
      this.logger.error(`Falha ao enviar notificação Telegram: ${err.message}`);
    }
  }

  /** Notificação de boas-vindas para novo cliente do reseller */
  async sendWelcome(chatId: string | number, brandName: string, email: string, tempPass: string) {
    await this.send(
      chatId,
      `🎉 *Bem-vindo à ${brandName}!*\n\n` +
      `Seu acesso foi criado:\n` +
      `📧 E-mail: \`${email}\`\n` +
      `🔑 Senha temporária: \`${tempPass}\`\n\n` +
      `Acesse o painel e crie seu primeiro bot! 🤖`,
    );
  }

  /** Alerta de bot com erro para o dono do bot */
  async sendBotError(chatId: string | number, botSlug: string, error: string) {
    await this.send(
      chatId,
      `🔴 *Bot com erro!*\n\n` +
      `Bot: \`${botSlug}\`\n` +
      `Erro: ${error.slice(0, 200)}\n\n` +
      `Acesse o painel para reiniciar.`,
    );
  }

  /** Confirmação de bot provisionado com sucesso */
  async sendBotReady(chatId: string | number, botSlug: string) {
    await this.send(
      chatId,
      `✅ *Bot ativo!*\n\n` +
      `Seu bot \`${botSlug}\` está rodando.\n` +
      `Acesse o painel para gerenciá-lo.`,
    );
  }
}
