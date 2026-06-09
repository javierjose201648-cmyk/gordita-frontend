import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { tokenStore } from '../api/client';

const USER_KEY = 'gorditas_user';

interface AuthCtx {
  user: User | null;
  login:   (user: User, token: string) => void;
  logout:  () => void;
  isAdmin: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const s = localStorage.getItem(USER_KEY);
    return s ? (JSON.parse(s) as User) : null;
  });

  const login = (u: User, token: string) => {
    tokenStore.set(token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, login, logout, isAdmin: user?.rol === 'administrador' }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be inside AuthProvider');
  return c;
}
