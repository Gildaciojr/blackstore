import type { PagbankPaymentStatus } from './pagbank.provider';

export type PaymentTransitionAction = 'apply' | 'duplicate' | 'ignore' | 'manual_review';

export type PaymentTransitionDecision = {
  action: PaymentTransitionAction;
  reason: string;
};

export function decidePaymentTransition(
  currentStatus: string,
  incomingStatus: PagbankPaymentStatus,
): PaymentTransitionDecision {
  if (currentStatus === 'paid') {
    return incomingStatus === 'paid'
      ? { action: 'duplicate', reason: 'payment_already_paid' }
      : { action: 'ignore', reason: 'paid_cannot_regress' };
  }

  if (currentStatus === 'failed') {
    if (incomingStatus === 'paid') {
      return { action: 'manual_review', reason: 'paid_after_reservation_release' };
    }
    return incomingStatus === 'failed'
      ? { action: 'duplicate', reason: 'payment_already_failed' }
      : { action: 'ignore', reason: 'failed_cannot_return_to_pending' };
  }

  if (currentStatus === incomingStatus) {
    return { action: 'duplicate', reason: 'status_already_applied' };
  }

  return { action: 'apply', reason: 'valid_transition' };
}
