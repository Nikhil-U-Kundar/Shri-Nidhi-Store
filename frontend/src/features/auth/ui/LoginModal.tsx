import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { useAuth } from '@/entities/user';

type Mode = 'signin' | 'signup';

const INPUT_CLASS = 'w-full rounded-xl border border-stone-200 p-2.5 focus:border-emerald-600 focus:outline-none';

/** One sign-in for everyone. The account's role decides whether the admin console or the storefront opens. */
export function LoginModal() {
  const { isLoginOpen, setLoginOpen, login, registerCustomer } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoginOpen) return null;

  const close = () => {
    setLoginOpen(false);
    setError('');
    setPassword('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await registerCustomer(name.trim(), phone.trim());
      } else {
        await login(loginId.trim(), password);
      }
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal label="Sign in" onClose={close} size="sm:max-w-md">
      <div className="flex items-center justify-between bg-stone-900 p-4 text-white">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Sri Nidhi Store</p>
          <h2 className="text-sm font-black">{mode === 'signup' ? 'Create your account' : 'Sign in to continue'}</h2>
        </div>
        <button
          type="button"
          onClick={close}
          className="cursor-pointer rounded-full p-1.5 text-stone-300 hover:bg-stone-800"
          aria-label="Close sign in"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'signup' ? (
            <>
              <div>
                <label htmlFor="login-name" className="mb-1 block font-semibold text-stone-700">Your name</label>
                <input
                  id="login-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={INPUT_CLASS}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              <div>
                <label htmlFor="login-phone" className="mb-1 block font-semibold text-stone-700">Phone number</label>
                <input
                  id="login-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className={INPUT_CLASS}
                  placeholder="10-digit mobile"
                />
                <p className="mt-1 text-[10px] text-stone-400">Your phone number is also your password.</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="login-id" className="mb-1 block font-semibold text-stone-700">Phone number or email</label>
                <input
                  id="login-id"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  autoComplete="username"
                  className={INPUT_CLASS}
                  placeholder="10-digit mobile or email"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="mb-1 block font-semibold text-stone-700">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={`${INPUT_CLASS} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1 text-stone-400"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-xl bg-emerald-700 py-3 font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError('');
          }}
          className="w-full cursor-pointer text-[11px] font-semibold text-emerald-800"
        >
          {mode === 'signin' ? 'New customer? Create an account' : 'Already registered? Sign in'}
        </button>
      </div>
    </Modal>
  );
}
