import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Tenant } from './entities/tenant.entity';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { InventoryItem } from './entities/inventory.entity';
import * as bcrypt from 'bcryptjs';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'saas_ecommerce',
  entities: [Tenant, User, Product, Warehouse, InventoryItem],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);
  const warehouseRepo = AppDataSource.getRepository(Warehouse);
  const inventoryRepo = AppDataSource.getRepository(InventoryItem);

  // Tenant 1: Mundo Mascota
  const tm = tenantRepo.create({ code: 'mundo-mascota', legalName: 'Mundo Mascota SPA', displayName: 'Mundo Mascota', domain: 'mundo.example', currency: 'CLP', language: 'es', branding: { theme: 'pet' } });
  await tenantRepo.save(tm);
  const hash1 = await bcrypt.hash('password1', 10);
  const u1 = userRepo.create({ tenant: tm, email: 'admin@mundomascota.test', passwordHash: hash1, role: 'TENANT_OWNER' });
  await userRepo.save(u1);

  // Warehouses
  const w1 = warehouseRepo.create({ tenant: tm, name: 'Bodega Centro', code: 'BOD1', address: 'Av. Principal 123' });
  const w2 = warehouseRepo.create({ tenant: tm, name: 'Bodega Norte', code: 'BOD2', address: 'Calle Norte 45' });
  await warehouseRepo.save([w1, w2]);

  // Products with variants (simplified)
  const p1 = productRepo.create({ tenant: tm, sku: 'ALIM-01', name: 'Alimento Premium 1kg', description: 'Alimento para perros 1kg', attributes: { type: 'food', species: 'dog' } });
  const p2 = productRepo.create({ tenant: tm, sku: 'JUG-01', name: 'Juguete Squeaky', description: 'Juguete para perros', attributes: { type: 'toy' } });
  await productRepo.save([p1, p2]);

  // Inventory
  const i1 = inventoryRepo.create({ tenant: tm, product: p1 as any, warehouse: w1 as any, stockPhysical: 100, stockReserved: 0 });
  const i2 = inventoryRepo.create({ tenant: tm, product: p2 as any, warehouse: w2 as any, stockPhysical: 50, stockReserved: 0 });
  await inventoryRepo.save([i1, i2]);

  // Tenant 2: Agua Clara
  const ta = tenantRepo.create({ code: 'agua-clara', legalName: 'Agua Clara Ltda', displayName: 'Agua Clara', domain: 'agua.example', currency: 'CLP', language: 'es', branding: { theme: 'water' } });
  await tenantRepo.save(ta);
  const hash2 = await bcrypt.hash('password2', 10);
  const u2 = userRepo.create({ tenant: ta, email: 'admin@aguaclara.test', passwordHash: hash2, role: 'TENANT_OWNER' });
  await userRepo.save(u2);

  const wa = warehouseRepo.create({ tenant: ta, name: 'Bodega Principal', code: 'BODA', address: 'Ruta 5 km 10' });
  await warehouseRepo.save(wa);

  const pa = productRepo.create({ tenant: ta, sku: 'BD20', name: 'Bidón 20L', description: 'Bidón de agua 20 litros', attributes: { type: 'container', returnable: true } });
  await productRepo.save(pa);
  const ia = inventoryRepo.create({ tenant: ta, product: pa as any, warehouse: wa as any, stockPhysical: 200, stockReserved: 0 });
  await inventoryRepo.save(ia);

  console.log('Seeding completed');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
