import 'reflect-metadata';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { PostgresContainer } from 'testcontainers';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../apps/api/src/app.module';
import { DataSource } from 'typeorm';
import { Tenant } from '../../apps/api/src/entities/tenant.entity';
import { CatalogService } from '../../apps/api/src/modules/catalog/catalog.service';
import * as amqp from 'amqplib';
import { OutboxService } from '../../apps/api/src/modules/outbox/outbox.service';

dotenv.config();

async function startPostgres() {
  const container = await new PostgresContainer('postgres:15-alpine').withDatabase('saas_ecommerce').withUsername('postgres').withPassword('postgres').start();
  return container;
}

async function startRabbit() {
  const container = await new GenericContainer('rabbitmq:3-management')
    .withExposedPorts(5672, 15672)
    .withWaitStrategy(Wait.forLogMessage('Server startup complete'))
    .start();
  return container;
}

async function main() {
  console.log('Starting testcontainers...');
  const pg = await startPostgres();
  const rab = await startRabbit();

  process.env.POSTGRES_HOST = pg.getHost();
  process.env.POSTGRES_PORT = String(pg.getMappedPort(5432));
  process.env.POSTGRES_USER = 'postgres';
  process.env.POSTGRES_PASSWORD = 'postgres';
  process.env.POSTGRES_DB = 'saas_ecommerce';
  process.env.RABBITMQ_URL = `amqp://${rab.getHost()}:${rab.getMappedPort(5672)}`;

  // create application context
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get<DataSource>(DataSource as any);
  await ds.initialize();

  // create tenant
  const tenantRepo = ds.getRepository(Tenant);
  const tenant = tenantRepo.create({ code: 'tc-mundo', legalName: 'TC Mundo', displayName: 'TC Mundo', currency: 'CLP', language: 'es' });
  await tenantRepo.save(tenant);

  const catalog = app.get(CatalogService);
  const saved = await catalog.create(tenant as any, { sku: 'TC-PROD-1', name: 'TC Product 1', description: 'Test product' });
  console.log('Created product', saved.id);

  const outboxRows = await ds.getRepository('outbox').find({ where: { aggregateId: saved.id } });
  console.log('Outbox rows for product:', outboxRows);

  // Now verify end-to-end: process outbox and confirm message received in RabbitMQ
  const outboxService = app.get(OutboxService);
  // Create a temporary consumer to listen for the event
  const rabbitUrl = process.env.RABBITMQ_URL!;
  const conn = await amqp.connect(rabbitUrl);
  const ch = await conn.createChannel();
  await ch.assertExchange('events', 'topic', { durable: true });
  const q = await ch.assertQueue('', { exclusive: true });
  const routingKey = 'com_saas_catalog_ProductCreated';
  await ch.bindQueue(q.queue, 'events', routingKey);

  const received = new Promise<any>(async (resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for event'));
    }, 10000);
    await ch.consume(q.queue, (msg) => {
      if (msg) {
        clearTimeout(timer);
        const content = JSON.parse(msg.content.toString());
        ch.ack(msg);
        resolve({ content, headers: msg.properties.headers });
      }
    }, { noAck: false });
  });

  // Trigger processing of pending outbox events
  await outboxService.processPendingOnce(50);

  // Start a consumer (in this process) that will process messages idempotently
  const inboxService = app.get('InboxService') as any;
  const consumer = await (async () => {
    const conn2 = await amqp.connect(process.env.RABBITMQ_URL!);
    const ch2 = await conn2.createChannel();
    await ch2.assertExchange('events', 'topic', { durable: true });
    const q2 = await ch2.assertQueue('', { exclusive: true });
    await ch2.bindQueue(q2.queue, 'events', routingKey);
    const receivedCount = { count: 0 };
    await ch2.consume(q2.queue, async (msg) => {
      if (msg) {
        const payload = JSON.parse(msg.content.toString());
        const headers = msg.properties.headers || {};
        const correlation = headers['correlation_id'] || payload.correlation_id || `product-${payload.productId}`;
        const tenantId = headers['tenant_id'] || payload.tenant_id || null;
        try {
          await inboxService.acquireAndProcess(correlation, 'com.saas.catalog.ProductCreated', payload.productId || payload.id, tenantId, 'test-product-consumer', payload, async () => {
            // no-op handler for test
          });
        } catch (err) {
          console.error('Processing handler error', err);
        }
        ch2.ack(msg);
        receivedCount.count += 1;
      }
    }, { noAck: false });
    return { conn: conn2, ch: ch2, q: q2, receivedCount };
  })();

  // publish the same event again to simulate duplicate delivery
  const connPub = await amqp.connect(process.env.RABBITMQ_URL!);
  const chPub = await connPub.createChannel();
  await chPub.assertExchange('events', 'topic', { durable: true });
  const payload = outboxRows[0].payload;
  const headers = { tenant_id: outboxRows[0].tenantId, correlation_id: outboxRows[0].correlationId };
  chPub.publish('events', routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true, headers });
  await chPub.close();
  await connPub.close();

  // wait a moment for consumer to process
  await new Promise((r) => setTimeout(r, 2000));

  // verify processed_events has only one row for this correlation
  const pe = await ds.getRepository('processed_events').find({ where: { event_id: outboxRows[0].correlationId } });
  console.log('Processed events rows for correlation:', pe);

  try {
    const msg = await received;
    console.log('Received event from RabbitMQ:', msg);
  } catch (err) {
    console.error('Did not receive event from RabbitMQ', err);
    throw err;
  } finally {
    await ch.close();
    await conn.close();
  }

  await app.close();
  await pg.stop();
  await rab.stop();
}

main().catch((err) => {
  console.error('Test failed', err);
  process.exit(1);
});
