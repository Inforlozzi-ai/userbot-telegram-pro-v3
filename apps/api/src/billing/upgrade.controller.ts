import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AsaasService } from './asaas.service';
import { UsersService } from '../users/users.service';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class UpgradeController {
  constructor(
    private asaas: AsaasService,
    private users: UsersService,
  ) {}

  @Post('upgrade')
  async upgrade(@Body() body: { plan: string }, @Request() req) {
    const user = req.user;
    let customerId = user.asaasCustomerId;
    if (!customerId) {
      const customer = await this.asaas.createCustomer(user.name, user.email);
      customerId = customer.id;
      await this.users.update(user.id, { asaasCustomerId: customerId });
    }
    const planMap: Record<string, string> = {
      starter: process.env.ASAAS_PLAN_STARTER,
      pro: process.env.ASAAS_PLAN_PRO,
      agency: process.env.ASAAS_PLAN_AGENCY,
    };
    const planId = planMap[body.plan];
    const sub = await this.asaas.createSubscription(customerId, planId);
    await this.users.update(user.id, { asaasSubscriptionId: sub.id, plan: body.plan as any });
    return { message: 'Assinatura criada!', subscriptionId: sub.id };
  }
}
