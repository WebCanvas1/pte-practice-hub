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
import { useAuth, type AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Log in — ${siteConfig.name}` },
      {
        name: "description",
        content: `Log in to your ${siteConfig.name} student dashboard to continue your PTE practice.`,
      },
      { property: "og:title", content: `Log in — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Access your practice tests, scores and AI feedback.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  return (
    <AuthLayout
      title="Welcome back"
      description="Log in to continue your practice and view your score history."
      footer={
        <p className="text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <form
        className="grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setSubmitting(true);
          setFormError(null);
          setFields({});
          try {
            const data = await authApi<{ user: Omit<AuthUser, "name"> }>("login", {
              email: String(form.get("email") ?? ""),
              password: String(form.get("password") ?? ""),
            });
            setUser(data.user);
            toast.success("Signed in");
            const target =
              search.redirect ?? (data.user.roles.includes("admin") ? "/admin" : "/student");
            void navigate({ to: target });
          } catch (error) {
            const apiError =
              error instanceof ApiError ? error : new ApiError(0, "Unable to sign in.");
            setFormError(apiError.message);
            setFields(apiError.fields);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {formError ? (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Sign in failed</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="login-email">Email address</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={Boolean(fields["email"])}
            aria-describedby={fields["email"] ? "login-email-error" : undefined}
          />
          {fields["email"] ? (
            <p id="login-email-error" className="text-xs text-destructive">
              {fields["email"]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(fields["password"])}
          />
          {fields["password"] ? (
            <p className="text-xs text-destructive">{fields["password"]}</p>
          ) : null}
        </div>

        <Button type="submit" variant="hero" size="lg" disabled={submitting}>
          {submitting ? "Signing in…" : "Log in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
