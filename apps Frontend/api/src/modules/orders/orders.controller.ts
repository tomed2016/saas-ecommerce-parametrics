import { Controller, Post, Body, Headers, Param, Get, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { TenantService } from '../tenant/tenant.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';

@Controller('orders')
export class OrdersController {
  constructor(private svc: OrdersService, private tenants: TenantService) {}

  private async resolveTenant(headers: any) {
    const code = headers['x-tenant-code'] || headers['x-tenant-id'];
    if (!code) throw new Error('Missing tenant header');
    const t = await this.tenants.findByCode(code);
    if (!t) throw new Error('Tenant not found');
    return t;
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:create')
  async create(@Body() body: any, @Headers() headers: any, @Req() req: any) {
    const tenant = await this.resolveTenant(headers);
    if (req.user && req.user.tenantId && req.user.tenantId !== tenant.id) throw new Error('Tenant mismatch');
    return this.svc.createOrder(tenant, body);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Headers() headers: any) {
    const tenant = await this.resolveTenant(headers);
    return this.svc.findById(tenant, id);
  }
}
