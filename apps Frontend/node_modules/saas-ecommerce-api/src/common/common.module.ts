import { Global, Module } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { PermissionsGuard } from './permissions.guard';

@Global()
@Module({
  providers: [PolicyService, PermissionsGuard],
  exports: [PolicyService, PermissionsGuard],
})
export class CommonModule {}
