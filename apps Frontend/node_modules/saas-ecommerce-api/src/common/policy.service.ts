import { Injectable } from '@nestjs/common';

@Injectable()
export class PolicyService {
  private rolePermissions: Record<string, string[]> = {
    TENANT_OWNER: ['product:create','product:read','product:update','product:delete','inventory:adjust','warehouse:manage','order:create','order:read'],
    TENANT_ADMIN: ['product:create','product:read','product:update','inventory:adjust','order:read'],
    SALES_MANAGER: ['order:create','order:read','product:read'],
    WAREHOUSE_MANAGER: ['inventory:adjust','warehouse:manage','inventory:read'],
    DISPATCH_OPERATOR: ['dispatch:create','dispatch:update','order:read'],
    CUSTOMER_SUPPORT: ['order:read'],
    VIEWER: ['product:read','order:read'],
    PLATFORM_SUPER_ADMIN: ['tenant:configure','role:manage','audit:read','product:read','order:read']
  };

  hasPermission(role: string, permission: string): boolean {
    if (!role) return false;
    const perms = this.rolePermissions[role] || [];
    return perms.includes(permission);
  }
}
