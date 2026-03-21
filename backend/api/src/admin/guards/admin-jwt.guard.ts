import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const auth = request.headers.authorization;

    if (!auth || typeof auth !== 'string') {
      throw new UnauthorizedException();
    }

    const token = auth.replace('Bearer ', '');

    try {
      jwt.verify(token, process.env.ADMIN_JWT_SECRET as string);

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
