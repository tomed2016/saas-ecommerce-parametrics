import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column()
  status: string;

  @Column({ type: 'jsonb' })
  lines: any;

  @Column({ type: 'numeric', default: 0 })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;
}
