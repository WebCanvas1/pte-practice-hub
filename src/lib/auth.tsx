/**
 * Authentication state backed by the Cloudflare Worker API.
 *
 * The session itself is an HTTP-only cookie set by the Worker, so refreshing
 * the page keeps the user signed in: on mount we simply ask the server who we
 * are via GET /api/public/auth/session.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { authApi } from "@/lib/api";

export type UserRole = "student" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  roles: UserRole[];
  firstName: string;
  lastName: string;
  country: string;
  timezone: string;
  emailPreferences: { marketing: boolean; product: boolean };
  deletionRequested: boolean;
  /** Convenience display name used by the dashboard chrome. */
  name: string;
}

interface SessionResponse {
  user: Omit<AuthUser, "name"> | null;
  storage?: "d1" | "memory";
}

function withName(user: Omit<AuthUser, "name"> | null): AuthUser | null {
  if (!user) return null;
  const name = `${user.firstName} ${user.lastName}`.trim();
  return { ...user, name: name.length > 0 ? name : user.email };
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  /** "memory" means no D1 binding is attached (local dev fallback). */
  storage: "d1" | "memory" | null;
  refresh: () => Promise<AuthUser | null>;
  setUser: (user: Omit<AuthUser, "name"> | null) => void;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [storage, setStorage] = useState<"d1" | "memory" | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await authApi<SessionResponse>("session");
      const next = withName(data.user);
      setUserState(next);
      setStorage(data.storage ?? null);
      return next;
    } catch {
      setUserState(null);
      return null;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setUser = useCallback((next: Omit<AuthUser, "name"> | null) => {
    setUserState(withName(next));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi("logout", {});
    } finally {
      setUserState(null);
    }
  }, []);

  const signOutEverywhere = useCallback(async () => {
    try {
      await authApi("logout-all", {});
    } finally {
      setUserState(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, storage, refresh, setUser, signOut, signOutEverywhere }),
    [user, ready, storage, refresh, setUser, signOut, signOutEverywhere],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/**
 * Client-side route guard. Server handlers enforce the same rules — this only
 * controls what is rendered and where the user is sent.
 */
export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      void navigate({ to: "/login", search: { redirect: pathname } });
      return;
    }
    if (!user.roles.includes(role)) {
      void navigate({ to: user.roles.includes("admin") ? "/admin" : "/student" });
    }
  }, [ready, user, role, navigate, pathname]);

  if (!ready || !user || !user.roles.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" role="status">
        <p className="text-sm text-muted-foreground">Checking your access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
