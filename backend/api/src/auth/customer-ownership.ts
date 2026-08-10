import { ForbiddenException } from '@nestjs/common';

export function assertCustomerOwnership(
  requestedCustomerId: string,
  authenticatedCustomerId: string,
) {
  if (requestedCustomerId !== authenticatedCustomerId) {
    throw new ForbiddenException('Customer ownership mismatch');
  }
}
