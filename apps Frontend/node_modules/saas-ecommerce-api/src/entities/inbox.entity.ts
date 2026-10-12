import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity({ name: 'inbox' })
@Unique(['eventId', 'consumerName'])
export class Inbox {
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

  @Column()
  consumerName: string;

  @Column({ default: 'PROCESSING' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;
}
