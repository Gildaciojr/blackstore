import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export type AuthenticatedCustomer = {
  id: string;
};

export type CustomerRequest = Request & {
  customer?: AuthenticatedCustomer;
};

type CustomerJwtPayload = jwt.JwtPayload & {
  userId?: unknown;
};

@Injectable()
export class CustomerJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    const authorization = request.headers.authorization;
    const secret = process.env.JWT_SECRET;

    if (!authorization?.startsWith('Bearer ') || !secret) {
      throw new UnauthorizedException();
    }

    const token = authorization.slice('Bearer '.length).trim();

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = jwt.verify(token, secret) as CustomerJwtPayload;

      if (typeof payload.userId !== 'string' || !payload.userId) {
        throw new UnauthorizedException();
      }

      request.customer = { id: payload.userId };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
