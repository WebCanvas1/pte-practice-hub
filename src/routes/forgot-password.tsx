import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { siteConfig } from "@/config/site";

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

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we'll send a reset link once email delivery is connected."
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
          <AlertDescription>
            If an account exists for that address, a reset link will be sent. Password reset email
            delivery is not enabled in this preview.
          </AlertDescription>
        </Alert>
      ) : (
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
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
          <Button type="submit" variant="hero" size="lg">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
