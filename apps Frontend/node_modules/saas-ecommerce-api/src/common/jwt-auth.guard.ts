import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!auth) throw new UnauthorizedException('Missing Authorization header');
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') throw new UnauthorizedException('Invalid Authorization header');
    const token = parts[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
      req.user = payload;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
