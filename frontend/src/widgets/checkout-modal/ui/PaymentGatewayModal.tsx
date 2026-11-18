import { useState } from 'react';
import { AlertOctagon, CheckCircle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import type { OrderRequest } from '../model/usePlaceOrder';

export interface GatewayRequest extends OrderRequest {
  amount: number;
}

interface PaymentGatewayModalProps {
  request: GatewayRequest;
  onClose: () => void;
  onPaid: (request: OrderRequest) => Promise<void>;
  onRetry: () => void;
  onReturnToCart: () => void;
}

/** Simulated UPI / card authorisation step shown after checkout for online payments. */
export function PaymentGatewayModal({ request, onClose, onPaid, onRetry, onReturnToCart }: PaymentGatewayModalProps) {
  const [isDeclined, setIsDeclined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSimulatedResult = async (success: boolean) => {
    if (!success) {
      setIsDeclined(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await onPaid(request);
    } catch {
      setIsDeclined(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal label="Payment gateway" onClose={onClose} size="sm:max-w-md">
      <div className="relative p-6 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 cursor-pointer rounded-full p-1 text-stone-400 hover:text-stone-700"
          aria-label="Close payment"
        >
          <X className="h-5 w-5" />
        </button>

        {!isDeclined ? (
          <div>
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
            <h3 className="text-base font-black text-stone-900">Connecting to Secure UPI & Banking Gateway</h3>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              Please authorize payment request on your Google Pay, PhonePe, or Banking app...
            </p>

            <dl className="mt-4 space-y-1 rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-left text-xs">
              <div className="flex justify-between gap-2 text-stone-600">
                <dt>Merchant:</dt>
                <dd className="font-bold text-stone-900">Sri Nidhi Store Sector 14</dd>
              </div>
              <div className="flex justify-between gap-2 text-stone-600">
                <dt>Method:</dt>
                <dd className="text-right font-bold text-stone-900">{request.paymentMethod}</dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-stone-200 pt-1 text-sm font-black text-stone-900">
                <dt>Amount:</dt>
                <dd className="text-emerald-800 tabular-nums">₹{request.amount}</dd>
              </div>
            </dl>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSimulatedResult(true)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-60"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{isSubmitting ? 'Placing order…' : 'Simulate Success'}</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSimulatedResult(false)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-100 py-2.5 text-xs font-bold text-red-800 transition hover:bg-red-200 disabled:opacity-60"
              >
                <AlertOctagon className="h-4 w-4" />
                <span>Simulate Decline</span>
              </button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1 text-[10px] text-stone-400">
              <ShieldCheck className="h-3 w-3" /> Encrypted connection
            </p>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertOctagon className="h-8 w-8" />
            </div>
            <h3 className="text-base font-black text-stone-900">Payment Declined by Bank</h3>
            <p className="mt-1 text-xs text-stone-500">
              The banking server declined authorization. No funds were debited from your account.
            </p>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeclined(false);
                  onRetry();
                }}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Another Payment Method / Retry</span>
              </button>
              <button
                type="button"
                onClick={onReturnToCart}
                className="w-full cursor-pointer rounded-xl bg-stone-100 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-200"
              >
                Cancel &amp; Return to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
