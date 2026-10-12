import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../../entities/cart.entity';
import { CartService } from './cart.service';
import { TenantModule } from '../tenant/tenant.module';
import { CartController } from './cart.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cart]), TenantModule],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
