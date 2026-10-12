import { Controller, Post, Body, Get } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantController {
  constructor(private svc: TenantService) {}

  @Post()
  async create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Get()
  async list() {
    return this.svc.findAll();
  }
}
