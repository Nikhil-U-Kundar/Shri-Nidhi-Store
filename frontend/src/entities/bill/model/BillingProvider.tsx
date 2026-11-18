import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Bill } from './types';
import { initialBills } from './mock-data';
import { billApi } from '../api/billApi';

interface BillingValue {
  bills: Bill[];
  setBills: (update: Bill[] | ((prev: Bill[]) => Bill[])) => void;
  /** Bill open in the take-bill dialog, or null when it is closed. */
  activeBill: Bill | null;
  setActiveBill: (bill: Bill | null) => void;
}

interface BillingProviderProps {
  children: ReactNode;
  /** Bill archive is only loaded for the shop owner. */
  isAdmin: boolean;
}

const BillingContext = createContext<BillingValue | null>(null);

export function BillingProvider({ children, isAdmin }: BillingProviderProps) {
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [activeBill, setActiveBill] = useState<Bill | null>(null);

  const refreshBills = useCallback(async () => {
    try {
      setBills(await billApi.list());
    } catch {
      /* keep what is already on screen */
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void refreshBills();
  }, [isAdmin, refreshBills]);

  const value = useMemo<BillingValue>(
    () => ({ bills, setBills, activeBill, setActiveBill }),
    [bills, activeBill]
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling(): BillingValue {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used within BillingProvider');
  return ctx;
}
