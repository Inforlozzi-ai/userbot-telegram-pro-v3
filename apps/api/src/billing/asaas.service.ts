import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AsaasService {
  private logger = new Logger('AsaasService');
  private base = 'https://www.asaas.com/api/v3';
  private headers = () => ({ 'access_token': process.env.ASAAS_API_KEY });

  async createCustomer(name: string, email: string, cpfCnpj?: string) {
    try {
      const { data } = await axios.post(`${this.base}/customers`, { name, email, cpfCnpj }, { headers: this.headers() });
      return data;
    } catch (e) {
      this.logger.error('Erro ao criar customer Asaas', e?.response?.data);
      throw e;
    }
  }

  async createSubscription(customerId: string, planId: string, billingType = 'PIX') {
    try {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 1);
      const { data } = await axios.post(`${this.base}/subscriptions`, {
        customer: customerId,
        billingType,
        value: 49.90,
        nextDueDate: nextDue.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        externalReference: planId,
      }, { headers: this.headers() });
      return data;
    } catch (e) {
      this.logger.error('Erro ao criar subscription Asaas', e?.response?.data);
      throw e;
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const { data } = await axios.delete(`${this.base}/subscriptions/${subscriptionId}`, { headers: this.headers() });
      return data;
    } catch (e) {
      this.logger.error('Erro ao cancelar subscription', e?.response?.data);
    }
  }
}
