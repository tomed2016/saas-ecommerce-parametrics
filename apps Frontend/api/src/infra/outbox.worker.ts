import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Outbox } from '../entities/outbox.entity';
import * as amqp from 'amqplib';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'saas_ecommerce',
  entities: [Outbox],
  synchronize: false,
});

async function main() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Outbox);
  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
  const conn = await amqp.connect(rabbitUrl);
  const ch = await conn.createChannel();
  await ch.assertExchange('events', 'topic', { durable: true });

  console.log('Outbox worker started, polling every 5s');

  async function processOnce() {
    const now = new Date();
    const items = await repo.find({ where: [{ status: 'PENDING' }, { status: 'FAILED' }], take: 20 });
    for (const it of items) {
      try {
        if (it.nextAttemptAt && it.nextAttemptAt > now) continue;
        const routingKey = it.eventType.replace(/\./g, '_');
        const payload = Buffer.from(JSON.stringify({ ...it.payload, correlation_id: it.correlationId, tenant_id: it.tenantId }));
        ch.publish('events', routingKey, payload, { persistent: true, headers: { tenant_id: it.tenantId, correlation_id: it.correlationId } });
        it.status = 'PUBLISHED';
        it.attempts = (it.attempts || 0) + 1;
        it.nextAttemptAt = null as any;
        it.lastError = null as any;
        await repo.save(it);
        console.log('Published outbox', it.id, it.eventType);
      } catch (err: any) {
        console.error('Publish failed', err?.message || err);
        it.attempts = (it.attempts || 0) + 1;
        it.lastError = err?.message || String(err);
        if (it.attempts >= 5) {
          it.status = 'FAILED';
        } else {
          it.status = 'PENDING';
          const backoffSeconds = Math.pow(2, it.attempts);
          it.nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000 + Math.floor(Math.random() * 1000));
        }
        await repo.save(it);
      }
    }
  }

  // loop
  setInterval(processOnce, 5000);
}

main().catch((err) => {
  console.error('Outbox worker failed', err);
  process.exit(1);
});
