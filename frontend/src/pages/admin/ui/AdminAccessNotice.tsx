import { Lock } from 'lucide-react';
import { useAuth } from '@/entities/user';
import { useNavigation } from '@/shared/lib/navigation';

/** Shown on /admin to anyone who is not the shop owner. The API enforces access separately. */
export function AdminAccessNotice() {
  const { isLoggedIn, setLoginOpen } = useAuth();
  const { navigate } = useNavigation();

  return (
    <div className="admin-glass flex min-h-screen items-center justify-center p-4">
      <div className="glass-panel w-full max-w-sm space-y-4 rounded-3xl border p-8 text-center">
        <Lock className="mx-auto h-8 w-8 text-emerald-700" />
        <h1 className="text-lg font-black text-stone-900">Shop owner area</h1>
        <p className="text-xs text-stone-600">
          {isLoggedIn ? 'Your account does not have admin access.' : 'Sign in with the shop owner account to continue.'}
        </p>
        {!isLoggedIn && (
          <button type="button" onClick={() => setLoginOpen(true)} className="w-full cursor-pointer bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800">
            Sign in
          </button>
        )}
        <button type="button" onClick={() => navigate('/')} className="w-full cursor-pointer py-2 text-xs font-bold text-stone-600 hover:text-stone-900">
          Back to the store
        </button>
      </div>
    </div>
  );
}
