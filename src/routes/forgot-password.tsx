import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { siteConfig } from "@/config/site";
import { ApiError, authApi } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: `Reset your password — ${siteConfig.name}` },
      {
        name: "description",
        content: `Request a password reset link for your ${siteConfig.name} student or admin account.`,
      },
      { property: "og:title", content: `Reset your password — ${siteConfig.name}` },
      { property: "og:description", content: "Request a secure password reset link by email." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we'll send you a secure reset link."
      footer={
        <p className="text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </p>
      }
    >
      {sent ? (
        <Alert>
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription className="grid gap-2">
            <span>
              If an account exists for that address, a password reset link is on its way. The link
              expires in one hour.
            </span>
            {devLink ? (
              <a className="break-all text-primary underline" href={devLink}>
                {devLink}
              </a>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : (
        <form
          className="grid gap-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSubmitting(true);
            setError(null);
            try {
              const data = await authApi<{ devLink?: string }>("forgot-password", {
                email: String(form.get("email") ?? ""),
              });
              setDevLink(data.devLink ?? null);
              setSent(true);
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Unable to send the reset link.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="reset-email">Email address</Label>
            <Input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-describedby="reset-email-hint"
            />
            <p id="reset-email-hint" className="text-xs text-muted-foreground">
              Use the address you registered with.
            </p>
          </div>
          <Button type="submit" variant="hero" size="lg" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
