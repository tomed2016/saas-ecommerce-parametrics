import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'outbox' })
export class Outbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  aggregateId: string;

  @Column()
  aggregateType: string;

  @Column()
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ nullable: true })
  correlationId: string;

  @Column({ type: 'timestamp', nullable: true })
  nextAttemptAt: Date;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @CreateDateColumn()
  createdAt: Date;
}
