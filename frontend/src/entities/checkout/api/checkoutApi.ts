import { apiRequest } from '@/shared/api';

export type CheckoutStep = 'contact' | 'address' | 'delivery' | 'payment' | 'placed';

/** Details recorded with a step. Only the fields known at that step are sent. */
export type CheckoutDetails = Record<string, string | number | undefined>;

/** A random id for one checkout attempt, kept by the browser until the shopper places or leaves. */
export function newCheckoutSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const checkoutApi = {
  saveStep(sessionId: string, step: CheckoutStep, details: CheckoutDetails): Promise<unknown> {
    return apiRequest('/checkout/steps', {
      method: 'POST',
      body: JSON.stringify({ sessionId, step, details }),
    });
  },
};
