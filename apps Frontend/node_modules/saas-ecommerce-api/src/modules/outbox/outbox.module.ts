import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Outbox } from '../../entities/outbox.entity';
import { OutboxService } from './outbox.service';
import { OutboxController } from './outbox.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Outbox])],
  providers: [OutboxService],
  controllers: [OutboxController],
  exports: [OutboxService],
})
export class OutboxModule {}
