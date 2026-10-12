import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from '../../entities/inventory.entity';
import { Warehouse } from '../../entities/warehouse.entity';
import { InventoryService } from './inventory.service';
import { TenantModule } from '../tenant/tenant.module';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, Warehouse]), TenantModule],
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
