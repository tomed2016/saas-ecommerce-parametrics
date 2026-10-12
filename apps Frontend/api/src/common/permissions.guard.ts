import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PolicyService } from './policy.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private policy: PolicyService) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler()) || [];
    if (required.length === 0) return true; // no permission required
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Missing user');
    const role = user.role;
    for (const p of required) {
      if (!this.policy.hasPermission(role, p)) throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
