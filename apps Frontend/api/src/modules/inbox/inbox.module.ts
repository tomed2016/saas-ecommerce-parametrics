import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inbox } from '../../entities/inbox.entity';
import { ProcessedEvent } from '../../entities/processed-event.entity';
import { InboxService } from './inbox.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inbox, ProcessedEvent])],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
