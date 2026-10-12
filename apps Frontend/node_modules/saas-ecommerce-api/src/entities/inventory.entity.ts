import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';

@Entity({ name: 'inventory' })
@Unique(['tenant', 'product', 'warehouse'])
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ type: 'int', default: 0 })
  stockPhysical: number;

  @Column({ type: 'int', default: 0 })
  stockReserved: number;
}
