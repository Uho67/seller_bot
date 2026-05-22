import React, { createContext, useContext, useState } from 'react';

interface AuthCtx {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  token: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const login = (t: string) => {
    localStorage.setItem('token', t);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return React.createElement(AuthContext.Provider, { value: { token, login, logout } }, children);
}

export const useAuth = () => useContext(AuthContext);
