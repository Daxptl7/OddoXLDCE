"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { clearToken, getToken, setToken } from "@/lib/auth/token";
import type { SerializedUser, SignupInput, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: SerializedUser | null;
  isLoading: boolean;
  /** Convenience mirror of user.role — undefined while signed out. */
  role: UserRole | undefined;
  login: (email: string, password: string) => Promise<SerializedUser>;
  signup: (data: SignupInput) => Promise<SerializedUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SerializedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();

  async function hydrate() {
    // Yield a tick first so every setState below happens asynchronously,
    // never synchronously inside the effect that calls this.
    await Promise.resolve();

    if (!getToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const { user: me } = await auth.me();
      setUser(me);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearToken();
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // hydrate() only ever sets state after an awaited call (auth.me() or a
    // Promise.resolve() tick) — the lint rule can't see through the async
    // boundary, but nothing here sets state synchronously during this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hydrate();
  }, []);

  // Both return the account so callers can route on its role without waiting
  // for the context state to settle.
  async function login(email: string, password: string) {
    const { user: loggedInUser, token } = await auth.login({ email, password });
    setToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function signup(data: SignupInput) {
    const { user: newUser, token } = await auth.signup(data);
    setToken(token);
    setUser(newUser);
    return newUser;
  }

  async function logout() {
    try {
      await auth.logout();
    } catch {
      // Cookie/session may already be gone server-side; clearing local state still matters.
    }
    clearToken();
    setUser(null);
    queryClient.clear();
    router.push("/");
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, role: user?.role, login, signup, logout, refresh: hydrate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
