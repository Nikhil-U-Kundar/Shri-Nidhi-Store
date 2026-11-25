import { AdminConsole } from '@/widgets/admin-console';
import { PosBilling } from '@/widgets/pos-billing';

export function AdminPage() {
  return <AdminConsole billing={<PosBilling />} />;
}
