import { useAuth } from '@/entities/user';
import { AdminConsole } from '@/widgets/admin-console';
import { PosBilling } from '@/widgets/pos-billing';
import { AdminAccessNotice } from './AdminAccessNotice';

export function AdminPage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminConsole billing={<PosBilling />} /> : <AdminAccessNotice />;
}
