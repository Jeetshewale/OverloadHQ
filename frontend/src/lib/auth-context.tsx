"use client";
// ---------------------------------------------------------------
// OverloadHQ – Auth Context
// Resilient authentication with dual Cookie & Token persistence
// ---------------------------------------------------------------

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api";

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  goal: string;
  experienceLevel: string;
  workoutSplit?: string;
  bodyWeightKg: number | null;
  preferredUnit: "KG" | "LB";
  visibility: string;
  onboardingDone: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    name: string;
    inviteCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isBackendAwake: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAwake, setIsBackendAwake] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.auth.me();
      setUser(data.user);
      setIsBackendAwake(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Clear stale token if unauthorized
        if (typeof window !== "undefined") {
          localStorage.removeItem("overloadhq_token");
        }
        setUser(null);
        setIsBackendAwake(true);
      } else {
        // Backend might be sleeping (Render cold start)
        setIsBackendAwake(false);
        // Retry once after a delay
        setTimeout(async () => {
          try {
            const data = await api.auth.me();
            setUser(data.user);
            setIsBackendAwake(true);
          } catch {
            setIsBackendAwake(true);
            setUser(null);
          }
        }, 2500);
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const data = await api.auth.login({ email: email.trim(), password });
      if (data?.token && typeof window !== "undefined") {
        localStorage.setItem("overloadhq_token", data.token);
      }
      setUser(data.user);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : (err?.message || "Login failed");
      setError(msg);
      throw err;
    }
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    name: string;
    inviteCode?: string;
  }) => {
    setError(null);
    try {
      const res = await api.auth.register({
        ...data,
        email: data.email.trim(),
        username: data.username.trim(),
        name: data.name.trim(),
      });
      if (res?.token && typeof window !== "undefined") {
        localStorage.setItem("overloadhq_token", res.token);
      }
      setUser(res.user);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : (err?.message || "Registration failed");
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("overloadhq_token");
      }
      await api.auth.logout();
    } catch (e) {
      console.warn("Backend logout request error, clearing client auth state", e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        refreshUser,
        isBackendAwake,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
