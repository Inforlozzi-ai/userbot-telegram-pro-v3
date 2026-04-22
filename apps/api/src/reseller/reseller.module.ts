import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reseller } from './reseller.entity';
import { ResellerClient } from './reseller-client.entity';
import { User } from '../users/user.entity';
import { ResellersService } from './reseller.service';
import { ResellersController } from './reseller.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reseller, ResellerClient, User]), AuthModule],
  providers: [ResellersService],
  controllers: [ResellersController],
  exports: [ResellersService],
})
export class ResellersModule {}
