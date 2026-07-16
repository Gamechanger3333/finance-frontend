"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { apiGet } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  userType: string;
  currency: string;
  monthlyIncomeGoal?: number | null;
  currentBalance?: number | null;
  financialHealthScore?: number | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await apiGet("/api/auth/me");
      setUser(data as User);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = (token: string, userData: User) => {
    saveToken(token);
    setUser(userData);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Token helpers
const TOKEN_KEY = "finflow_token";
const TOKEN_COOKIE = "finflow_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  // Mirrored into a cookie (readable, not httpOnly — same trust level as
  // localStorage) purely so the Next.js middleware can do a fast, server-side
  // "is anyone logged in" check before the page ever renders. The real
  // authorization check still happens on every API request via the JWT
  // that the backend verifies (see requireAuth middleware).
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${
    60 * 60 * 24 * 7
  }; samesite=lax`;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
