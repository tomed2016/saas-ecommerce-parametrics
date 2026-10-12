import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../entities/tenant.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TenantService {
  constructor(@InjectRepository(Tenant) private repo: Repository<Tenant>) {}

  async create(dto: Partial<Tenant>) {
    const t = this.repo.create({
      code: dto.code || uuidv4().split('-')[0],
      legalName: dto.legalName,
      displayName: dto.displayName,
      domain: dto.domain,
      currency: dto.currency || 'CLP',
      language: dto.language || 'es',
      branding: dto.branding || {},
    });
    return this.repo.save(t);
  }

  async findByCode(code: string) {
    return this.repo.findOne({ where: { code } });
  }

  async findAll() {
    return this.repo.find();
  }
}
