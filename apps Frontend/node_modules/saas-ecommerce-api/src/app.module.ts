import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TenantModule } from './modules/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { Outbox } from './entities/outbox.entity';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { InventoryItem } from './entities/inventory.entity';
import { Cart } from './entities/cart.entity';
import { Order } from './entities/order.entity';
import { Inbox } from './entities/inbox.entity';
import { ProcessedEvent } from './entities/processed-event.entity';
import { CommonModule } from './common/common.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { InboxModule } from './modules/inbox/inbox.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'saas_ecommerce',
        entities: [Tenant, User, Product, Warehouse, InventoryItem, Cart, Order, Outbox, Inbox, ProcessedEvent],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Tenant, User, Product, Warehouse, InventoryItem, Cart, Order, Outbox, Inbox, ProcessedEvent]),
    TenantModule,
    AuthModule,
    CatalogModule,
    InventoryModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    OutboxModule,
    InboxModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
