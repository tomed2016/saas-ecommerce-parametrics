import { Controller, Post, Body, Headers, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { TenantService } from '../tenant/tenant.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';

@Controller('inventory')
export class InventoryController {
  constructor(private svc: InventoryService, private tenants: TenantService) {}

  private async resolveTenant(headers: any) {
    const code = headers['x-tenant-code'] || headers['x-tenant-id'];
    if (!code) throw new Error('Missing tenant header');
    const t = await this.tenants.findByCode(code);
    if (!t) throw new Error('Tenant not found');
    return t;
  }

  @Post('warehouses')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('warehouse:manage')
  async createWarehouse(@Body() body: any, @Headers() headers: any, @Req() req: any) {
    const tenant = await this.resolveTenant(headers);
    if (req.user && req.user.tenantId && req.user.tenantId !== tenant.id) throw new Error('Tenant mismatch');
    return this.svc.createWarehouse(tenant, body);
  }

  @Post('adjust')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('inventory:adjust')
  async adjust(@Body() body: any, @Headers() headers: any, @Req() req: any) {
    const tenant = await this.resolveTenant(headers);
    if (req.user && req.user.tenantId && req.user.tenantId !== tenant.id) throw new Error('Tenant mismatch');
    return this.svc.adjustStock(tenant, body.productId, body.warehouseId, body.delta);
  }
}
