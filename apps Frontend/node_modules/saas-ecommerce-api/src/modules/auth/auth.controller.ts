import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private svc: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.svc.registerTenantAndOwner(body.tenant, body.user);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.svc.loginLocal(body.email, body.password);
  }

  @Post('totp/generate')
  async generateTotp(@Body() body: any) {
    return this.svc.generateTotpSecret();
  }

  @Post('totp/verify')
  async verifyTotp(@Body() body: any) {
    return { ok: this.svc.verifyTotp(body.token, body.secret) };
  }
}
