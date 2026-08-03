/**
 * Placeholder authentication layer.
 *
 * There is intentionally NO backend yet. The session is stored in
 * localStorage so the dashboards can be reviewed before Cloudflare
 * D1 / Workers auth is wired up. Swap the functions below for real
 * calls to `/api/auth/*` Worker routes later — the component API
 * (useAuth, RequireRole) should not need to change.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

export type UserRole = "student" | "admin";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = "pte_demo_session";

interface AuthContextValue {
  user: DemoUser | null;
  ready: boolean;
  signIn: (email: string, role?: UserRole, name?: string) => DemoUser;
  register: (name: string, email: string) => DemoUser;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): DemoUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readSession());
    setReady(true);
  }, []);

  const persist = useCallback((next: DemoUser | null) => {
    setUser(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — session stays in memory only */
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signIn: (email, role = "student", name) => {
        const next: DemoUser = {
          id: "demo-user",
          email,
          role,
          name: name ?? email.split("@")[0]?.replace(/[._-]/g, " ") ?? "Student",
        };
        persist(next);
        return next;
      },
      register: (name, email) => {
        const next: DemoUser = { id: "demo-user", name, email, role: "student" };
        persist(next);
        return next;
      },
      signOut: () => persist(null),
    }),
    [user, ready, persist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/**
 * Route protection placeholder. Redirects to the login screen when the
 * demo session does not match the required role. Replace with a real
 * `beforeLoad` session check once Workers auth exists.
 */
export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      void navigate({ to: "/login" });
      return;
    }
    if (user.role !== role) {
      void navigate({ to: user.role === "admin" ? "/admin" : "/student" });
    }
  }, [ready, user, role, navigate]);

  if (!ready || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" role="status">
        <p className="text-sm text-muted-foreground">Checking your access…</p>
      </div>
    );
  }

  return <>{children}</>;
}
