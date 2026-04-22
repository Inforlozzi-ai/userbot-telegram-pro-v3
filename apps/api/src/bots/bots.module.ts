import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bot } from './bot.entity';
import { BotsService } from './bots.service';
import { BotsController, BotsInternalController } from './bots.controller';
import { AuthModule } from '../auth/auth.module';
import { ProvisionerModule } from '../provisioner/provisioner.module';

@Module({
  imports: [TypeOrmModule.forFeature([Bot]), AuthModule, ProvisionerModule],
  providers: [BotsService],
  controllers: [BotsController, BotsInternalController],
  exports: [BotsService],
})
export class BotsModule {}
