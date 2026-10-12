import { Controller, Post, UseGuards, Param } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { PermissionsGuard } from '../../common/permissions.guard';
import { Permissions } from '../../common/permissions.decorator';

@Controller('admin/outbox')
export class OutboxController {
  constructor(private svc: OutboxService) {}

  // Protected admin endpoint to process outbox once
  @Post('process')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant:configure')
  async processOnce() {
    return this.svc.processPendingOnce(50);
  }

  @Post('failed')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant:configure')
  async listFailed() {
    return this.svc.listFailed(100, 0);
  }

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant:configure')
  async retry(@Param('id') id: string) {
    return this.svc.retryOutbox(id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant:configure')
  async publish(@Param('id') id: string) {
    return this.svc.publishById(id);
  }
}
