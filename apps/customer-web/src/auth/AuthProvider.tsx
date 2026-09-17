import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { marketplaceApi } from '../api';
import type { AuthSession, LoginInput, RegisterInput } from '../api/types';
import { sessionStorage } from './sessionStorage';

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => sessionStorage.get());

  const value = useMemo<AuthContextValue>(() => ({
    session,
    isAuthenticated: Boolean(session),
    async login(input) {
      const next = await marketplaceApi.login(input);
      sessionStorage.set(next);
      setSession(next);
    },
    async register(input) {
      const next = await marketplaceApi.register(input);
      sessionStorage.set(next);
      setSession(next);
    },
    async logout() {
      try {
        await marketplaceApi.logout();
      } finally {
        sessionStorage.clear();
        setSession(null);
      }
    },
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
