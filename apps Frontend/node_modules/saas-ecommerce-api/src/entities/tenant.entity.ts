import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // short unique code

  @Column()
  legalName: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ default: 'CLP' })
  currency: string;

  @Column({ default: 'es' })
  language: string;

  @Column({ type: 'jsonb', nullable: true })
  branding: any;
}
