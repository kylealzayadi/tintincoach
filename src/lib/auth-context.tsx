"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { UserRole } from "./types";

interface AuthState {
  authenticated: boolean;
  role: UserRole;
}

interface AuthContextType {
  auth: AuthState | null;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PASSWORDS: Record<string, UserRole> = {
  war: "client",
  tin: "coach",
  Tin: "coach",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tintin_auth");
    if (stored) {
      try {
        setAuth(JSON.parse(stored));
      } catch {
        localStorage.removeItem("tintin_auth");
      }
    }
    setLoaded(true);
  }, []);

  function login(password: string): boolean {
    const role = PASSWORDS[password];
    if (!role) return false;
    const state: AuthState = { authenticated: true, role };
    setAuth(state);
    localStorage.setItem("tintin_auth", JSON.stringify(state));
    return true;
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem("tintin_auth");
  }

  if (!loaded) return null;

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
