import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BotsModule } from './bots/bots.module';
import { ProvisionerModule } from './provisioner/provisioner.module';
import { BillingModule } from './billing/billing.module';
import { UsersModule } from './users/users.module';
import { ResellersModule } from './reseller/reseller.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TelegramAuthModule } from './telegram-auth/telegram-auth.module';
import { User } from './users/user.entity';
import { Bot } from './bots/bot.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Bot],
      synchronize: true,
      ssl: false,
    }),
    UsersModule,
    AuthModule,
    BotsModule,
    ProvisionerModule,
    BillingModule,
    ResellersModule,
    NotificationsModule,
    TelegramAuthModule,
  ],
})
export class AppModule {}
