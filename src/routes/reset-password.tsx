import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { siteConfig } from "@/config/site";
import { ApiError, authApi } from "@/lib/api";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? (search["token"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: `Choose a new password — ${siteConfig.name}` },
      { name: "description", content: `Set a new password for your ${siteConfig.name} account.` },
      { property: "og:title", content: `Choose a new password — ${siteConfig.name}` },
      { property: "og:description", content: "Set a new password and sign back in securely." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  return (
    <AuthLayout
      title="Choose a new password"
      description="For your security, all other devices will be signed out."
      footer={
        <p className="text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </p>
      }
    >
      {token.length === 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Reset link missing</AlertTitle>
          <AlertDescription>
            Open the link from your reset email, or request a new one from the{" "}
            <Link to="/forgot-password" className="underline">
              forgot password
            </Link>{" "}
            page.
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
            setFields({});
            try {
              await authApi("reset-password", {
                token,
                password: String(form.get("password") ?? ""),
                confirmPassword: String(form.get("confirmPassword") ?? ""),
              });
              toast.success("Password updated — please log in.");
              void navigate({ to: "/login" });
            } catch (err) {
              const apiError = err instanceof ApiError ? err : new ApiError(0, "Unable to reset.");
              setError(apiError.message);
              setFields(apiError.fields);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Reset failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-describedby="new-password-hint"
            />
            <p id="new-password-hint" className="text-xs text-muted-foreground">
              At least 10 characters with upper and lowercase letters and a number.
            </p>
            {fields["password"] ? (
              <p className="text-xs text-destructive">{fields["password"]}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-new-password">Confirm new password</Label>
            <Input
              id="confirm-new-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
            {fields["confirmPassword"] ? (
              <p className="text-xs text-destructive">{fields["confirmPassword"]}</p>
            ) : null}
          </div>
          <Button type="submit" variant="hero" size="lg" disabled={submitting}>
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
