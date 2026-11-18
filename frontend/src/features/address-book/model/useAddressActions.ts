import { useCallback } from 'react';
import { userApi, type Address } from '@/entities/user';
import { useAuth } from '@/features/auth';
import { errorMessage } from '@/shared/lib/errors';
import { useToast } from '@/shared/ui/toast';

/** Save and remove delivery addresses. Guests keep addresses for the current page view only. */
export function useAddressActions() {
  const { isLoggedIn, patchUser } = useAuth();
  const { addToast } = useToast();

  const addAddress = useCallback(
    async (address: Omit<Address, 'id'>): Promise<Address | null> => {
      if (isLoggedIn) {
        try {
          const saved = await userApi.addAddress(address);
          patchUser((prev) => ({ ...prev, addresses: [...prev.addresses, saved] }));
          addToast('New delivery address saved', 'success');
          return saved;
        } catch (err) {
          addToast(errorMessage(err, 'Could not save address'), 'error');
          return null;
        }
      }

      const local: Address = { ...address, id: `addr-${Date.now()}` };
      patchUser((prev) => ({ ...prev, addresses: [...prev.addresses, local] }));
      addToast('New delivery address saved', 'success');
      return local;
    },
    [isLoggedIn, patchUser, addToast]
  );

  const removeAddress = useCallback(
    async (id: string) => {
      if (isLoggedIn) {
        try {
          await userApi.removeAddress(id);
        } catch (err) {
          addToast(errorMessage(err, 'Could not remove address'), 'error');
          return;
        }
      }
      patchUser((prev) => ({ ...prev, addresses: prev.addresses.filter((a) => a.id !== id) }));
      addToast('Address removed', 'info');
    },
    [isLoggedIn, patchUser, addToast]
  );

  return { addAddress, removeAddress };
}
