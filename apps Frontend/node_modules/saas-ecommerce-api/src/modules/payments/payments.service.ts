import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  // Simulated payment: accept if amount is even cents, fail otherwise (deterministic for tests)
  async initiatePayment(orderId: string, amountCents: number) {
    const success = amountCents % 2 === 0;
    return {
      orderId,
      amountCents,
      status: success ? 'SUCCEEDED' : 'FAILED',
      providerReference: `SIM-${Math.random().toString(36).substr(2,8)}`,
    };
  }
}
