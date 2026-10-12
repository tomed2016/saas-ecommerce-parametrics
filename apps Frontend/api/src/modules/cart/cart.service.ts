import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../entities/cart.entity';
import { Tenant } from '../../entities/tenant.entity';

@Injectable()
export class CartService {
  constructor(@InjectRepository(Cart) private repo: Repository<Cart>) {}

  async create(tenant: Tenant, dto: any) {
    const cart = this.repo.create({ tenant, customerId: dto.customerId || null, items: dto.items || [], checkedOut: false });
    return this.repo.save(cart);
  }

  async addItem(tenant: Tenant, cartId: string, item: any) {
    const cart = await this.repo.findOne({ where: { id: cartId, tenant: { id: tenant.id } }, relations: ['tenant'] as any });
    if (!cart) throw new NotFoundException('Cart not found');
    const items = cart.items || [];
    items.push(item);
    cart.items = items;
    return this.repo.save(cart);
  }

  async getCart(tenant: Tenant, cartId: string) {
    return this.repo.findOne({ where: { id: cartId, tenant: { id: tenant.id } } });
  }
}
