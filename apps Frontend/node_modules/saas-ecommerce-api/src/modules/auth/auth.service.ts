import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as speakeasy from 'speakeasy';
import { Repository as TypeOrmRepository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Tenant) private tenants: Repository<Tenant>,
  ) {}

  async registerTenantAndOwner(tenantDto: any, userDto: any) {
    // create tenant
    const t = this.tenants.create(tenantDto as any);
    await this.tenants.save(t);

    const hash = await bcrypt.hash(userDto.password, 10);
    const u = new User();
    u.tenant = t as any;
    u.email = userDto.email;
    u.passwordHash = hash;
    u.role = 'TENANT_OWNER';
    await this.users.save(u);
    return { tenant: t, user: { id: u.id, email: u.email } };
  }

  async validateUser(email: string, password: string, tenantCode?: string) {
    const user = await this.users.findOne({ where: { email }, relations: ['tenant'] });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async loginLocal(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = { sub: user.id, email: user.email, tenantId: user.tenant?.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '15m' });
    const refresh = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET || 'dev-refresh', { expiresIn: '7d' });
    return { accessToken: token, refreshToken: refresh };
  }

  async validateToken(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
      // optionally fetch fresh user info
      const user = await this.users.findOne({ where: { id: payload.sub }, relations: ['tenant'] as any });
      if (!user) throw new UnauthorizedException('User not found');
      return { id: user.id, email: user.email, role: user.role, tenantId: user.tenant?.id };
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  generateTotpSecret() {
    return speakeasy.generateSecret({ length: 20 });
  }

  verifyTotp(token: string, secret: string) {
    return speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  }
}
