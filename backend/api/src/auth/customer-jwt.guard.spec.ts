import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { CustomerJwtGuard, type CustomerRequest } from './customer-jwt.guard';

describe('CustomerJwtGuard', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  function contextFor(request: Partial<CustomerRequest>) {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('reuses the existing JWT_SECRET and userId payload', () => {
    process.env.JWT_SECRET = 'phase-a-jwt-secret';
    const token = jwt.sign({ userId: 'customer-a' }, process.env.JWT_SECRET);
    const request = { headers: { authorization: `Bearer ${token}` } } as CustomerRequest;

    expect(new CustomerJwtGuard().canActivate(contextFor(request))).toBe(true);
    expect(request.customer).toEqual({ id: 'customer-a' });
  });

  it('rejects a token without the existing userId claim', () => {
    process.env.JWT_SECRET = 'phase-a-jwt-secret';
    const token = jwt.sign({ sub: 'customer-a' }, process.env.JWT_SECRET);
    const request = { headers: { authorization: `Bearer ${token}` } } as CustomerRequest;

    expect(() => new CustomerJwtGuard().canActivate(contextFor(request))).toThrow(
      UnauthorizedException,
    );
  });
});
