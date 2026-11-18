import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { billApi, useBilling, type Bill, type NewBill } from '@/entities/bill';
import { useCatalog } from '@/entities/product';
import type { KhataTransaction } from '@/entities/user';
import { useAuth } from '@/features/auth';
import { errorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/ui/toast';

function celebrate(): void {
  try {
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
  } catch {
    /* animation is decorative */
  }
}

/** Create and delete counter bills; API when reachable, otherwise a local record. */
export function useBillActions() {
  const { setBills, setActiveBill } = useBilling();
  const { isAdmin, isLoggedIn, patchUser } = useAuth();
  const { usingMockCatalog, refreshCatalog, setProducts } = useCatalog();
  const { addToast } = useToast();
  const useRemote = isLoggedIn && isAdmin && !usingMockCatalog;

  const createBill = useCallback(
    async (input: NewBill): Promise<Bill> => {
      if (useRemote) {
        try {
          const bill = await billApi.create(input);
          setBills((prev) => [bill, ...prev]);
          setActiveBill(bill);
          await refreshCatalog();
          celebrate();
          addToast(`Bill #${bill.billNumber} generated!`, 'success');
          return bill;
        } catch (err) {
          addToast(errorMessage(err, 'Could not create bill'), 'error');
          throw err;
        }
      }

      const now = new Date();
      const billNumber = `SN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const bill: Bill = {
        ...input,
        id: `bill-${Date.now()}`,
        billNumber,
        date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        timestamp: Date.now(),
      };

      if (bill.paymentMethod === 'Kirana Khata') {
        patchUser((prev) => {
          const balance = prev.khataBalance - bill.total;
          const entry: KhataTransaction = {
            id: `tx-${Date.now()}`,
            date: 'Today',
            timestamp: Date.now(),
            desc: `Bill #${billNumber}`,
            type: 'debit',
            amount: bill.total,
            balanceAfter: balance,
            referenceOrder: billNumber,
          };
          return { ...prev, khataBalance: balance, khataLedger: [entry, ...prev.khataLedger] };
        });
      }

      setProducts((prev) =>
        prev.map((p) => {
          const line = bill.items.find((bi) => bi.name.toLowerCase().trim() === p.name.toLowerCase().trim());
          return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
        })
      );
      setBills((prev) => [bill, ...prev]);
      setActiveBill(bill);
      celebrate();
      addToast(`Bill #${billNumber} generated!`, 'success');
      return bill;
    },
    [useRemote, setBills, setActiveBill, refreshCatalog, addToast, patchUser, setProducts]
  );

  const deleteBill = useCallback(
    async (billId: string) => {
      if (useRemote) {
        try {
          await billApi.remove(billId);
        } catch (err) {
          addToast(errorMessage(err, 'Could not delete bill'), 'error');
          return;
        }
      }
      setBills((prev) => prev.filter((b) => b.id !== billId));
      addToast('Bill removed from archive', 'info');
    },
    [useRemote, setBills, addToast]
  );

  return { createBill, deleteBill };
}
