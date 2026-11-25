import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { userApi } from '../api/userApi';
import { toUserProfile } from '../lib/mapper';
import { GUEST_PROFILE, type UserProfile } from './types';
import { clearSession, getStoredUser, getToken, saveSession } from '@/shared/api';
import { useToast } from '@/shared/ui/toast';
import { authApi, type AuthResponse } from '../api/authApi';

type Role = 'customer' | 'admin';

interface AuthValue {
  isLoggedIn: boolean;
  isAdmin: boolean;
  role: Role | null;
  user: UserProfile;
  patchUser: (update: (prev: UserProfile) => UserProfile) => void;
  refreshProfile: () => Promise<void>;
  login: (loginId: string, password: string) => Promise<void>;
  registerCustomer: (name: string, phone: string) => Promise<void>;
  logout: () => void;
  isLoginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { addToast } = useToast();
  const storedUser = getStoredUser();
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getToken()));
  const [role, setRole] = useState<Role | null>(() =>
    storedUser?.role === 'admin' ? 'admin' : storedUser ? 'customer' : null
  );
  const [user, setUser] = useState<UserProfile>(GUEST_PROFILE);
  const [isLoginOpen, setLoginOpen] = useState(false);

  const clearLocalSession = useCallback(() => {
    clearSession();
    setIsLoggedIn(false);
    setRole(null);
    setUser(GUEST_PROFILE);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getToken()) return;
    try {
      const apiUser = await userApi.profile();
      setRole(apiUser.role === 'admin' ? 'admin' : 'customer');
      setIsLoggedIn(true);
      setUser(toUserProfile(apiUser));
    } catch {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  useEffect(() => {
    if (getToken()) void refreshProfile();
  }, [refreshProfile]);

  const applySession = useCallback(
    async ({ token, user: authUser }: AuthResponse) => {
      const nextRole: Role = authUser.role === 'admin' ? 'admin' : 'customer';
      saveSession(token, { name: authUser.name ?? undefined, role: nextRole });
      setIsLoggedIn(true);
      setRole(nextRole);
      setLoginOpen(false);
      await refreshProfile();
    },
    [refreshProfile]
  );

  const login = useCallback(
    async (loginId: string, password: string) => {
      const data = await authApi.login(loginId, password);
      await applySession(data);
      addToast(
        data.user.role === 'admin' ? 'Signed in as shop owner' : `Signed in as ${data.user.name}`,
        'success'
      );
    },
    [applySession, addToast]
  );

  const registerCustomer = useCallback(
    async (name: string, phone: string) => {
      const data = await authApi.register(name, phone);
      await applySession(data);
      addToast(`Welcome ${data.user.name}!`, 'success');
    },
    [applySession, addToast]
  );

  const logout = useCallback(() => {
    clearLocalSession();
    addToast('Logged out. Browsing as Guest.', 'info');
  }, [clearLocalSession, addToast]);

  const patchUser = useCallback((update: (prev: UserProfile) => UserProfile) => {
    setUser(update);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      isLoggedIn,
      isAdmin: role === 'admin',
      role,
      user,
      patchUser,
      refreshProfile,
      login,
      registerCustomer,
      logout,
      isLoginOpen,
      setLoginOpen,
    }),
    [isLoggedIn, role, user, patchUser, refreshProfile, login, registerCustomer, logout, isLoginOpen]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
