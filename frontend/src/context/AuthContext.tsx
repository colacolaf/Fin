import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { UserOut } from "@fin/shared";
import { clearTokens, setLogoutHandler, authApi } from "../api/client";

interface AuthState {
  user: UserOut | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  // Try restore session on mount
  useEffect(() => {
    setLogoutHandler(logout);
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    // tokens stored by client internals
    setUser(res.user);
  }, []);

  const registerUser = useCallback(async (email: string, password: string, name: string) => {
    const res = await authApi.register(email, password, name);
    setUser(res.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register: registerUser, logout }),
    [user, loading, login, registerUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);