import { Injectable } from '@nestjs/common';
import { BaseService } from './base/base.service';
import { HttpService } from '@nestjs/axios';
import { ChargeType } from './dto/function/ChargeDto';

@Injectable()
export class MidtransService extends BaseService {
  constructor(httpService: HttpService) {
    super(httpService);
  }

  async charge(payload: ChargeType) {
    const data = await this.handleRequest('POST', '/v2/charge', payload);

    return data;
  }

  async approve(orderId: string) {
    const data = await this.handleRequest('GET', `/v2/${orderId}/approve`);

    return data;
  }

  async cancel(orderId: string) {
    const data = await this.handleRequest('GET', `/v2/${orderId}/cancel`);

    return data;
  }

  async deny(orderId: string) {
    const data = await this.handleRequest('GET', `/v2/${orderId}/deny`);

    return data;
  }

  async expire(orderId: string) {
    const data = await this.handleRequest('GET', `/v2/${orderId}/expire`);

    return data;
  }

  async refund(orderId: string) {
    const data = await this.handleRequest('GET', `/v2/${orderId}/expire`);

    return data;
  }

  async getStatus(orderId: string) {
    const data = await this.handleRequest('GET', `/v2/${orderId}/status`);

    return data;
  }
}
