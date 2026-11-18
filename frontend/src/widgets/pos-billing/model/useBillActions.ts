import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { billApi, useBilling, type Bill, type NewBill } from '@/entities/bill';
import { useCatalog } from '@/entities/product';
import { errorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/ui/toast';

function celebrate(): void {
  try {
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
  } catch {
    /* animation is decorative */
  }
}

/**
 * Create and delete counter bills. Every bill is saved to the bills table on the server;
 * if the save fails the bill is not recorded and the owner is told so.
 */
export function useBillActions() {
  const { setBills, setActiveBill } = useBilling();
  const { refreshCatalog } = useCatalog();
  const { addToast } = useToast();

  const createBill = useCallback(
    async (input: NewBill): Promise<Bill> => {
      try {
        const bill = await billApi.create(input);
        setBills((prev) => [bill, ...prev]);
        setActiveBill(bill);
        await refreshCatalog();
        celebrate();
        addToast(`Bill #${bill.billNumber} saved`, 'success');
        return bill;
      } catch (err) {
        addToast(errorMessage(err, 'Could not save the bill. It was not recorded.'), 'error');
        throw err;
      }
    },
    [setBills, setActiveBill, refreshCatalog, addToast]
  );

  const deleteBill = useCallback(
    async (billId: string) => {
      try {
        await billApi.remove(billId);
        setBills((prev) => prev.filter((b) => b.id !== billId));
        addToast('Bill removed from archive', 'info');
      } catch (err) {
        addToast(errorMessage(err, 'Could not delete the bill'), 'error');
      }
    },
    [setBills, addToast]
  );

  return { createBill, deleteBill };
}
