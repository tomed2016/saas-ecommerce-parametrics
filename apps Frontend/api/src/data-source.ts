import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { InventoryItem } from './entities/inventory.entity';
import { Cart } from './entities/cart.entity';
import { Order } from './entities/order.entity';
import { Outbox } from './entities/outbox.entity';
import { Inbox } from './entities/inbox.entity';
import { ProcessedEvent } from './entities/processed-event.entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'saas_ecommerce',
  entities: [Tenant, User, Product, Warehouse, InventoryItem, Cart, Order, Outbox, Inbox, ProcessedEvent],
  migrations: ["src/migrations/*.ts"],
  synchronize: false,
});
