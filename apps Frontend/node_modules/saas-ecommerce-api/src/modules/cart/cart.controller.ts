import { Controller, Post, Body, Headers, Param, Get } from '@nestjs/common';
import { CartService } from './cart.service';
import { TenantService } from '../tenant/tenant.service';

@Controller('cart')
export class CartController {
  constructor(private svc: CartService, private tenants: TenantService) {}

  private async resolveTenant(headers: any) {
    const code = headers['x-tenant-code'] || headers['x-tenant-id'];
    if (!code) throw new Error('Missing tenant header');
    const t = await this.tenants.findByCode(code);
    if (!t) throw new Error('Tenant not found');
    return t;
  }

  @Post()
  async create(@Body() body: any, @Headers() headers: any) {
    const tenant = await this.resolveTenant(headers);
    return this.svc.create(tenant, body);
  }

  @Post(':id/items')
  async addItem(@Param('id') id: string, @Body() body: any, @Headers() headers: any) {
    const tenant = await this.resolveTenant(headers);
    return this.svc.addItem(tenant, id, body);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Headers() headers: any) {
    const tenant = await this.resolveTenant(headers);
    return this.svc.getCart(tenant, id);
  }
}
