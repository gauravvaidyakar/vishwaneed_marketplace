import type { AuthSession } from '../api/types';

const SESSION_KEY = 'vishwaneed.customer.session';

export const sessionStorage = {
  get(): AuthSession | null {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },
  set(session: AuthSession): void {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },
  clear(): void {
    window.localStorage.removeItem(SESSION_KEY);
  },
};
