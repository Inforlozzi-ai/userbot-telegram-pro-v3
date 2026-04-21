import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reseller } from './reseller.entity';
import { ResellerClient } from './reseller-client.entity';
import { Commission } from './commission.entity';
import { User } from '../users/user.entity';
import { ResellerService } from './reseller.service';
import { ResellerController } from './reseller.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reseller, ResellerClient, Commission, User])],
  providers: [ResellerService],
  controllers: [ResellerController],
  exports: [ResellerService],
})
export class ResellerModule {}
