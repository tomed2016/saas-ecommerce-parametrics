import 'reflect-metadata';
import * as dotenv from 'dotenv';
import dataSource from '../../api/src/data-source';
import { InboxService } from '../../api/src/modules/inbox/inbox.service';
import { startProductCreatedConsumer } from '../../api/src/consumers/product-created.consumer';

dotenv.config();

async function main() {
  await dataSource.initialize();
  const inbox = new InboxService(dataSource as any);
  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
  console.log('Starting product-created consumer...');
  await startProductCreatedConsumer(rabbitUrl, dataSource as any, inbox as any);
}

main().catch((err) => {
  console.error('Consumer failed', err);
  process.exit(1);
});
