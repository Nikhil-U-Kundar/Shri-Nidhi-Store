import { useCallback } from 'react';
import { userApi, type KhataTransaction } from '@/entities/user';
import { useAuth } from '@/features/auth';
import { errorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/ui/toast';

/** Record a cash/UPI settlement against the customer's Kirana Khata balance. */
export function useRecordKhataPayment() {
  const { isLoggedIn, refreshProfile, patchUser } = useAuth();
  const { addToast } = useToast();

  return useCallback(
    async (amount: number, note: string) => {
      if (isLoggedIn) {
        try {
          await userApi.recordKhataPayment(amount, note);
          await refreshProfile();
          addToast(`Recorded ₹${amount} payment to Khata ledger`, 'success');
        } catch (err) {
          addToast(errorMessage(err, 'Could not record payment'), 'error');
        }
        return;
      }

      patchUser((prev) => {
        const balance = prev.khataBalance + amount;
        const entry: KhataTransaction = {
          id: `tx-${Date.now()}`,
          date: 'Today',
          timestamp: Date.now(),
          desc: note || 'Cash Payment recorded at Shop Counter',
          type: 'credit',
          amount,
          balanceAfter: balance,
        };
        return { ...prev, khataBalance: balance, khataLedger: [entry, ...prev.khataLedger] };
      });
      addToast(`Recorded ₹${amount} counter payment to Khata ledger`, 'success');
    },
    [isLoggedIn, refreshProfile, patchUser, addToast]
  );
}
