import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'processed_events' })
export class ProcessedEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  eventType: string;

  @Column()
  aggregateId: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @Column()
  consumerName: string;

  @CreateDateColumn()
  processedAt: Date;
}
