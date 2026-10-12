import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Outbox } from '../../entities/outbox.entity';
import * as amqp from 'amqplib';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private readonly maxAttempts = 5;
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(@InjectRepository(Outbox) private repo: Repository<Outbox>) {}

  private async ensureConnection() {
    if (this.channel && this.connection) return;
    const url = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange('events', 'topic', { durable: true });
  }

  /** Process a batch of pending outbox events once */
  async processPendingOnce(limit = 10) {
    await this.ensureConnection();
    const now = new Date();
    const items = await this.repo.find({ where: [{ status: 'PENDING' }, { status: 'FAILED' }], take: limit });
    const results: any[] = [];
    for (const it of items) {
      try {
        // Skip items scheduled for future attempts
        if (it.nextAttemptAt && it.nextAttemptAt > now) continue;

        const routingKey = it.eventType.replace(/\./g, '_');
        const payload = Buffer.from(JSON.stringify({ ...it.payload, correlation_id: it.correlationId, tenant_id: it.tenantId }));
        await this.channel!.publish('events', routingKey, payload, { persistent: true, headers: { tenant_id: it.tenantId, correlation_id: it.correlationId } });
        it.status = 'PUBLISHED';
        it.attempts = (it.attempts || 0) + 1;
        it.nextAttemptAt = null;
        it.lastError = null;
        await this.repo.save(it);
        results.push({ id: it.id, status: it.status });
      } catch (err: any) {
        this.logger.error('Failed publishing outbox event', err?.message || err);
        it.attempts = (it.attempts || 0) + 1;
        it.lastError = err?.message || String(err);
        if (it.attempts >= this.maxAttempts) {
          it.status = 'FAILED';
        } else {
          it.status = 'PENDING';
          // exponential backoff in seconds
          const backoffSeconds = Math.pow(2, it.attempts);
          it.nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000 + Math.floor(Math.random() * 1000));
        }
        await this.repo.save(it);
        results.push({ id: it.id, status: it.status, error: it.lastError });
      }
    }
    return results;
  }

  async listFailed(limit = 50, offset = 0) {
    return this.repo.find({ where: { status: 'FAILED' }, take: limit, skip: offset, order: { createdAt: 'DESC' } });
  }

  async retryOutbox(id: string) {
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new Error('Outbox item not found');
    it.status = 'PENDING';
    it.attempts = 0;
    it.nextAttemptAt = null as any;
    it.lastError = null as any;
    await this.repo.save(it);
    return it;
  }

  async publishById(id: string) {
    await this.ensureConnection();
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new Error('Outbox item not found');
    try {
      const routingKey = it.eventType.replace(/\./g, '_');
      const payload = Buffer.from(JSON.stringify({ ...it.payload, correlation_id: it.correlationId, tenant_id: it.tenantId }));
      await this.channel!.publish('events', routingKey, payload, { persistent: true, headers: { tenant_id: it.tenantId, correlation_id: it.correlationId } });
      it.status = 'PUBLISHED';
      it.attempts = (it.attempts || 0) + 1;
      it.nextAttemptAt = null as any;
      it.lastError = null as any;
      await this.repo.save(it);
      return it;
    } catch (err: any) {
      it.attempts = (it.attempts || 0) + 1;
      it.lastError = err?.message || String(err);
      if (it.attempts >= this.maxAttempts) it.status = 'FAILED';
      else {
        it.status = 'PENDING';
        const backoffSeconds = Math.pow(2, it.attempts);
        it.nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000 + Math.floor(Math.random() * 1000));
      }
      await this.repo.save(it);
      throw err;
    }
  }
}
