import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { Tenant } from '../../entities/tenant.entity';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private repo: Repository<Order>,
    private inventory: InventoryService,
    private payments: PaymentsService,
  ) {}

  async createOrder(tenant: Tenant, dto: any) {
    // dto: { lines: [{ productId, qty, priceCents }], customerId }
    if (!dto.lines || dto.lines.length === 0) throw new BadRequestException('Empty order');
    const total = dto.lines.reduce((s: number, l: any) => s + (l.priceCents || 0) * (l.qty || 1), 0);
    // Create order and corresponding outbox entry in a local transaction (outbox pattern)
    const saved = await this.repo.manager.transaction(async (manager) => {
      const order = manager.create(Order, { tenant, status: 'DRAFT', lines: dto.lines, totalAmount: total / 100 });
      const o = await manager.save(order);
      // create outbox event for OrderCreated
      const outboxRepo = manager.getRepository('outbox');
      await outboxRepo.save({
        aggregateId: o.id,
        aggregateType: 'Order',
        eventType: 'com.saas.order.OrderCreated',
        payload: { orderId: o.id, lines: dto.lines, totalAmount: total / 100 },
        status: 'PENDING',
        attempts: 0,
        tenantId: tenant.id,
        correlationId: `order-${o.id}`,
      });
      return o;
    });

    // try reserve inventory for each line (saga step)
    try {
      for (const l of dto.lines) {
        await this.inventory.reserve(tenant, l.productId, l.qty || 1);
      }
    } catch (e) {
      // mark order as CANCELED and publish compensation outbox
      saved.status = 'CANCELED';
      await this.repo.save(saved);
      await this.repo.manager.getRepository('outbox').save({
        aggregateId: saved.id,
        aggregateType: 'Order',
        eventType: 'com.saas.order.OrderCancelled',
        payload: { orderId: saved.id, reason: (e as any).message || 'Inventory reservation failed' },
        status: 'PENDING',
        attempts: 0,
        tenantId: tenant.id,
        correlationId: `order-${saved.id}`,
      });
      throw e;
    }

    // initiate payment (simulate)
    const payment = await this.payments.initiatePayment(saved.id, total);
    if (payment.status === 'SUCCEEDED') {
      saved.status = 'PAID';
      await this.repo.save(saved);
      // publish payment confirmed outbox
      await this.repo.manager.getRepository('outbox').save({
        aggregateId: saved.id,
        aggregateType: 'Order',
        eventType: 'com.saas.payment.PaymentSucceeded',
        payload: { orderId: saved.id, providerRef: payment.providerReference },
        status: 'PENDING',
        attempts: 0,
        tenantId: tenant.id,
        correlationId: `order-${saved.id}`,
      });
      return { order: saved, payment };
    } else {
      // release reservation
      for (const l of dto.lines) {
        await this.inventory.releaseReservation(tenant, l.productId, l.qty || 1);
      }
      saved.status = 'PENDING_PAYMENT';
      await this.repo.save(saved);
      await this.repo.manager.getRepository('outbox').save({
        aggregateId: saved.id,
        aggregateType: 'Order',
        eventType: 'com.saas.payment.PaymentFailed',
        payload: { orderId: saved.id, reason: 'Payment failed' },
        status: 'PENDING',
        attempts: 0,
        tenantId: tenant.id,
        correlationId: `order-${saved.id}`,
      });
      return { order: saved, payment };
    }
  }

  async findById(tenant: Tenant, id: string) {
    return this.repo.findOne({ where: { id, tenant: { id: tenant.id } } });
  }
}
