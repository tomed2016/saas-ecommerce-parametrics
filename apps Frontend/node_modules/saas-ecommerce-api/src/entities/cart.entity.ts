import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity({ name: 'carts' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ nullable: true })
  customerId: string;

  @Column({ type: 'jsonb', default: '[]' })
  items: any; // [{ productId, sku, quantity, price }]

  @Column({ default: false })
  checkedOut: boolean;
}
