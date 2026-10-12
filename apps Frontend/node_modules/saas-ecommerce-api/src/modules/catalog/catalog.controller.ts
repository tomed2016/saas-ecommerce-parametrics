import { Controller, Post, Body, Get, Headers, UseGuards, Req } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { Tenant } from '../../entities/tenant.entity';
import { TenantService } from '../tenant/tenant.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';

@Controller('catalog')
export class CatalogController {
  constructor(private svc: CatalogService, private tenants: TenantService) {}

  private async resolveTenant(headers: any): Promise<Tenant> {
    const code = headers['x-tenant-code'] || headers['x-tenant-id'];
    if (!code) throw new Error('Missing tenant header');
    const t = await this.tenants.findByCode(code);
    if (!t) throw new Error('Tenant not found');
    return t;
  }

  @Post('products')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:create')
  async createProduct(@Body() body: any, @Headers() headers: any, @Req() req: any) {
    const tenant = await this.resolveTenant(headers);
    // ensure token tenant matches header-resolved tenant
    if (req.user && req.user.tenantId && req.user.tenantId !== tenant.id) throw new Error('Tenant mismatch');
    return this.svc.create(tenant, body);
  }

  @Get('products')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:read')
  async listProducts(@Headers() headers: any, @Req() req: any) {
    const tenant = await this.resolveTenant(headers);
    if (req.user && req.user.tenantId && req.user.tenantId !== tenant.id) throw new Error('Tenant mismatch');
    return this.svc.findAll(tenant);
  }
}
