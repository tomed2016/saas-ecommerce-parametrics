import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Inbox } from '../../entities/inbox.entity';
import { ProcessedEvent } from '../../entities/processed-event.entity';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);
  constructor(private ds: DataSource) {}

  /**
   * Attempt to acquire the event for processing. If successful, runs handler and records processed event.
   * Uses DB-level unique constraint to avoid duplicates.
   */
  async acquireAndProcess(eventId: string, eventType: string, aggregateId: string, tenantId: string | null, consumerName: string, payload: any, handler: () => Promise<void>) {
    // Try to insert into inbox using raw query with ON CONFLICT DO NOTHING
    const insertSql = `INSERT INTO inbox (event_id, event_type, aggregate_id, tenant_id, consumer_name, status, payload) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING id`;
    const res: any = await this.ds.query(insertSql, [eventId, eventType, aggregateId, tenantId, consumerName, 'PROCESSING', payload]);
    if (!res || res.length === 0) {
      // already processed or being processed
      this.logger.debug(`Event ${eventId} already processed by ${consumerName}`);
      return false;
    }

    const inboxId = res[0].id;
    try {
      await handler();
      // mark processed and insert into processed_events
      const updateSql = `UPDATE inbox SET status=$1, processed_at=now() WHERE id=$2`;
      await this.ds.query(updateSql, ['PROCESSED', inboxId]);
      await this.ds.getRepository(ProcessedEvent).save({ eventId, eventType, aggregateId, tenantId, payload, consumerName });
      return true;
    } catch (err: any) {
      this.logger.error('Handler failed for event', err?.message || err);
      const updateSql = `UPDATE inbox SET status=$1, processed_at=now() WHERE id=$2`;
      await this.ds.query(updateSql, ['FAILED', inboxId]);
      throw err;
    }
  }
}
