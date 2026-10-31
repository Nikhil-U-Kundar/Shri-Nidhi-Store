import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle, RefreshCw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PaymentGatewayModalProps {
  orderParams: {
    deliveryAddress: string;
    deliveryMode: string;
    paymentMethod: string;
    customerName: string;
    customerPhone: string;
    amount: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
  onRetry: () => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  orderParams,
  onClose,
  onSuccess,
  onRetry
}) => {
  const { placeOrder, setCustomerTab } = useApp();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isFailed, setIsFailed] = useState(false);

  if (!orderParams) return null;

  const handleSimulateResult = (success: boolean) => {
    if (success) {
      placeOrder(orderParams);
      onSuccess();
      setCustomerTab('tracking');
    } else {
      setIsProcessing(false);
      setIsFailed(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-stone-200 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isFailed ? (
          <div>
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-base font-black text-stone-900">
              Connecting to Secure UPI & Banking Gateway
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Please authorize payment request on your Google Pay, PhonePe, or Banking app...
            </p>

            <div className="mt-4 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs space-y-1 text-left">
              <div className="flex justify-between text-stone-600">
                <span>Merchant:</span>
                <span className="font-bold text-stone-900">Sri Nidhi Store Sector 14</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Method:</span>
                <span className="font-bold text-stone-900">{orderParams.paymentMethod}</span>
              </div>
              <div className="flex justify-between font-black text-stone-900 text-sm pt-1 border-t border-stone-200">
                <span>Amount:</span>
                <span className="text-emerald-800 tabular-nums">₹{orderParams.amount}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => handleSimulateResult(true)}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Simulate Success</span>
              </button>
              <button
                onClick={() => handleSimulateResult(false)}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Simulate Decline</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-stone-900">Payment Declined by Bank</h3>
            <p className="text-xs text-stone-500 mt-1">
              The banking server declined authorization. No funds were debited from your account.
            </p>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => {
                  setIsFailed(false);
                  setIsProcessing(true);
                  onRetry();
                }}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Another Payment Method / Retry</span>
              </button>
              <button
                onClick={onClose}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Cancel & Return to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
