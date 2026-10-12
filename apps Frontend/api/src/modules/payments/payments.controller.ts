import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Post('simulate')
  async simulate(@Body() body: any) {
    // body: { orderId, amountCents }
    return this.svc.initiatePayment(body.orderId, body.amountCents);
  }
}
