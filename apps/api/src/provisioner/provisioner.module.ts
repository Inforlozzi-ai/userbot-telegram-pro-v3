import { Module } from '@nestjs/common';
import { ProvisionerService } from './provisioner.service';

@Module({
  providers: [ProvisionerService],
  exports: [ProvisionerService],
})
export class ProvisionerModule {}
