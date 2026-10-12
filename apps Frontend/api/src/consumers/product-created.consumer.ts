import * as amqp from 'amqplib';
import { DataSource } from 'typeorm';
import { InboxService } from '../modules/inbox/inbox.service';

export async function startProductCreatedConsumer(rabbitUrl: string, ds: DataSource, inbox: InboxService) {
  const conn = await amqp.connect(rabbitUrl);
  const ch = await conn.createChannel();
  await ch.assertExchange('events', 'topic', { durable: true });
  const q = await ch.assertQueue('product_created_consumer_queue', { durable: true });
  const routingKey = 'com_saas_catalog_ProductCreated';
  await ch.bindQueue(q.queue, 'events', routingKey);

  await ch.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      const headers = msg.properties.headers || {};
      const correlation = headers['correlation_id'] || payload.correlation_id || `prod-${payload.productId}`;
      const tenantId = headers['tenant_id'] || payload.tenant_id || null;
      const eventId = correlation;
      const eventType = 'com.saas.catalog.ProductCreated';
      const aggregateId = payload.productId || payload.id;

      await inbox.acquireAndProcess(eventId, eventType, aggregateId, tenantId, 'product-created-consumer', payload, async () => {
        // handler: save processed event is done by InboxService; more logic could be added here
        console.log('Processing ProductCreated for', aggregateId);
      });

      ch.ack(msg);
    } catch (err) {
      console.error('Failed processing message', err);
      ch.nack(msg, false, false);
    }
  }, { noAck: false });
}
