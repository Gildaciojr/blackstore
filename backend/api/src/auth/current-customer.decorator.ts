import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedCustomer, CustomerRequest } from './customer-jwt.guard';

export const CurrentCustomer = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedCustomer => {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    return request.customer as AuthenticatedCustomer;
  },
);
