import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../../entities/inventory.entity';
import { Warehouse } from '../../entities/warehouse.entity';
import { Tenant } from '../../entities/tenant.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem) private repo: Repository<InventoryItem>,
    @InjectRepository(Warehouse) private warehouses: Repository<Warehouse>,
  ) {}

  async createWarehouse(tenant: Tenant, dto: any) {
    const w = this.warehouses.create({ ...dto, tenant });
    return this.warehouses.save(w);
  }

  async adjustStock(tenant: Tenant, productId: string, warehouseId: string, delta: number) {
    // Persist adjustment and outbox event in a local transaction
    return this.repo.manager.transaction(async (manager) => {
      let item = await manager.findOne(InventoryItem as any, { where: { tenant: { id: tenant.id }, product: { id: productId }, warehouse: { id: warehouseId } }, relations: ['product','warehouse','tenant'] as any });
      if (!item) {
        item = manager.create(InventoryItem as any, { tenant, product: { id: productId } as any, warehouse: { id: warehouseId } as any, stockPhysical: 0, stockReserved: 0 });
      }
      item.stockPhysical = (item.stockPhysical || 0) + delta;
      if (item.stockPhysical < 0) throw new BadRequestException('Stock cannot be negative');
      const saved = await manager.save(item);
      const outboxRepo = manager.getRepository('outbox');
      await outboxRepo.save({
        aggregateId: saved.id,
        aggregateType: 'Inventory',
        eventType: 'com.saas.inventory.InventoryAdjusted',
        payload: { inventoryId: saved.id, productId, warehouseId, delta: delta },
        status: 'PENDING',
        attempts: 0,
        tenantId: tenant.id,
        correlationId: `inventory-${saved.id}`,
      });
      return saved;
    });
  }

  async reserve(tenant: Tenant, productId: string, qty: number) {
    // naive reservation: find any warehouse with enough stock
    const items = await this.repo.find({ where: { tenant: { id: tenant.id }, product: { id: productId } }, relations: ['warehouse'] as any });
    for (const it of items) {
      const available = it.stockPhysical - it.stockReserved;
      if (available >= qty) {
        it.stockReserved += qty;
        return this.repo.save(it);
      }
    }
    throw new BadRequestException('Insufficient stock');
  }

  async releaseReservation(tenant: Tenant, productId: string, qty: number) {
    const items = await this.repo.find({ where: { tenant: { id: tenant.id }, product: { id: productId } }, relations: ['warehouse'] as any });
    for (const it of items) {
      if (it.stockReserved >= qty) {
        it.stockReserved -= qty;
        return this.repo.save(it);
      }
    }
    throw new BadRequestException('No reservation found');
  }
}
