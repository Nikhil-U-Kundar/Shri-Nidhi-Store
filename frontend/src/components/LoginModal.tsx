import React, { useState } from 'react';
import { Store, UserRound, X, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, registerCustomer } = useApp();
  const [role, setRole] = useState<'customer' | 'admin'>('customer');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const close = () => {
    setIsLoginModalOpen(false);
    setError('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'admin') {
        await login(loginId.trim(), password, 'admin');
      } else if (mode === 'signup') {
        await registerCustomer(name.trim(), phone.trim());
      } else {
        await login(loginId.trim(), password, 'customer');
      }
      close();
    } catch (err: any) {
      setError(err?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Sri Nidhi Store</p>
            <h2 className="text-sm font-black">Sign in to continue</h2>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-300 cursor-pointer"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setRole('customer');
                setMode('signin');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                role === 'customer' ? 'bg-white text-emerald-800 shadow' : 'text-stone-500'
              }`}
            >
              <UserRound className="w-3.5 h-3.5" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setMode('signin');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                role === 'admin' ? 'bg-white text-amber-800 shadow' : 'text-stone-500'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Shop Owner
            </button>
          </div>

          {role === 'admin' && (
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Shop owner login opens the operations console. Customers cannot switch to admin from the storefront.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {role === 'customer' && mode === 'signup' && (
              <>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Your name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:border-emerald-600 focus:outline-none"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:border-emerald-600 focus:outline-none"
                    placeholder="10-digit mobile"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Your phone number is also your password.</p>
                </div>
              </>
            )}

            {(role === 'admin' || mode === 'signin') && (
              <>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {role === 'admin' ? 'Owner email' : 'Phone number'}
                  </label>
                  <input
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full p-2.5 border border-stone-200 rounded-xl focus:border-emerald-600 focus:outline-none"
                    placeholder={role === 'admin' ? 'admin@shreenidhi.store' : '10-digit mobile'}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full p-2.5 pr-10 border border-stone-200 rounded-xl focus:border-emerald-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 font-semibold">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md cursor-pointer"
            >
              {loading
                ? 'Please wait…'
                : role === 'admin'
                  ? 'Sign in as Shop Owner'
                  : mode === 'signup'
                    ? 'Create customer account'
                    : 'Sign in'}
            </button>
          </form>

          {role === 'customer' && (
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
              className="w-full text-[11px] font-semibold text-emerald-800 cursor-pointer"
            >
              {mode === 'signin' ? 'New customer? Create an account' : 'Already registered? Sign in'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
