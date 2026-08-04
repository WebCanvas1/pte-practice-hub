import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { siteConfig } from "@/config/site";
import { ApiError, authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? (search["token"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: `Verify your email — ${siteConfig.name}` },
      { name: "description", content: `Confirm your email address for ${siteConfig.name}.` },
      { property: "og:title", content: `Verify your email — ${siteConfig.name}` },
      { property: "og:description", content: "Confirm your email to unlock your dashboard." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const { refresh } = useAuth();
  const [state, setState] = useState<"pending" | "done" | "error">(token ? "pending" : "error");
  const [message, setMessage] = useState("This verification link is missing or invalid.");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        await authApi("verify-email", { token });
        if (cancelled) return;
        setState("done");
        await refresh();
      } catch (error) {
        if (cancelled) return;
        setMessage(error instanceof ApiError ? error.message : "Verification failed.");
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, refresh]);

  return (
    <AuthLayout title="Email verification" description="Confirming your email address.">
      {state === "pending" ? (
        <p className="text-sm text-muted-foreground" role="status">
          Verifying your email…
        </p>
      ) : state === "done" ? (
        <div className="grid gap-4">
          <Alert>
            <AlertTitle>Email verified</AlertTitle>
            <AlertDescription>Your email address is confirmed. You're all set.</AlertDescription>
          </Alert>
          <Button asChild variant="hero">
            <Link to="/student">Go to dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          <Alert variant="destructive" role="alert">
            <AlertTitle>Verification failed</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          <Button asChild variant="outline">
            <Link to="/student/account-settings">Request a new link</Link>
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
