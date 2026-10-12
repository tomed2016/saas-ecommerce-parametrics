import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../apps/api/src/app.module';
import { OrdersService } from '../../apps/api/src/modules/orders/orders.service';
import { TenantService } from '../../apps/api/src/modules/tenant/tenant.service';
import { DataSource } from 'typeorm';

dotenv.config();

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tenantService = app.get(TenantService);
  const ordersService = app.get(OrdersService);
  const dataSource = app.get<DataSource>(DataSource as any);

  // Find seeded tenant
  const tenant = await tenantService.findByCode('mundo-mascota');
  if (!tenant) {
    console.error('Tenant mundo-mascota not found. Run npm run seed first.');
    await app.close();
    process.exit(1);
  }

  // choose a seeded product id from seed script; we attempt to fetch one
  const product = await dataSource.getRepository('products').findOne({ where: { sku: 'ALIM-01', tenant: { id: tenant.id } } });
  if (!product) {
    console.error('Sample product not found for tenant. Ensure seed ran successfully.');
    await app.close();
    process.exit(1);
  }

  const orderDto = { lines: [{ productId: product.id, qty: 1, priceCents: 1000 }], customerId: 'test-cust' };

  try {
    const result = await ordersService.createOrder(tenant, orderDto);
    console.log('Order created id:', result.order.id);
    // query outbox rows
    const rows = await dataSource.getRepository('outbox').find({ where: { aggregateId: result.order.id } });
    console.log('Outbox rows for order:', rows);
  } catch (err: any) {
    console.error('Order creation failed', err?.message || err);
  } finally {
    await app.close();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
