import { createContext, useContext, useMemo, useState } from 'react';
import { clearAuth, getStoredUser, getToken, setAuth } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getToken());

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login: (nextToken, nextUser) => {
        setAuth(nextToken, nextUser);
        setToken(nextToken);
        setUser(nextUser);
      },
      logout: () => {
        clearAuth();
        setToken(null);
        setUser(null);
      },
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
