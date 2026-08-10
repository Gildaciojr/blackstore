import { createHash, timingSafeEqual } from 'crypto';

export function verifyPagbankWebhookSignature(
  rawBody: Buffer,
  authenticityToken: string,
  pagbankToken: string,
): boolean {
  if (!/^[a-fA-F0-9]{64}$/.test(authenticityToken)) {
    return false;
  }

  const expected = createHash('sha256').update(pagbankToken).update('-').update(rawBody).digest();
  const received = Buffer.from(authenticityToken, 'hex');

  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function secureStringEqual(left: string, right: string): boolean {
  const leftDigest = createHash('sha256').update(left).digest();
  const rightDigest = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}
