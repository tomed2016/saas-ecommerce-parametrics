import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { Tenant } from '../../entities/tenant.entity';

@Injectable()
export class CatalogService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  async create(tenant: Tenant, dto: any) {
    // Use local transaction to persist product and outbox event (transactional outbox)
    return this.repo.manager.transaction(async (manager) => {
      const product = manager.create(Product, { ...dto, tenant });
      const saved = await manager.save(product);
      const outboxRepo = manager.getRepository('outbox');
      await outboxRepo.save({
        aggregateId: saved.id,
        aggregateType: 'Product',
        eventType: 'com.saas.catalog.ProductCreated',
        payload: { productId: saved.id, name: saved.name, sku: saved.sku },
        status: 'PENDING',
        attempts: 0,
        tenantId: tenant.id,
        correlationId: `product-${saved.id}`,
      });
      return saved;
    });
  }

  async findAll(tenant: Tenant) {
    return this.repo.find({ where: { tenant: { id: tenant.id } } });
  }
}
