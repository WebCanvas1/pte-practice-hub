import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: `Log in — ${siteConfig.name}` },
      { name: "description", content: `Log in to your ${siteConfig.name} student dashboard to continue your PTE practice.` },
      { property: "og:title", content: `Log in — ${siteConfig.name}` },
      { property: "og:description", content: "Access your practice tests, scores and AI feedback." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [asAdmin, setAsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const email = String(form.get("email") ?? "");
          setSubmitting(true);
          signIn(email, asAdmin ? "admin" : "student");
          toast.success("Signed in (demo session)");
          void navigate({ to: asAdmin ? "/admin" : "/student" });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="login-email">Email address</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
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
            minLength={8}
            aria-describedby="login-password-hint"
          />
          <p id="login-password-hint" className="text-xs text-muted-foreground">
            Minimum 8 characters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="login-admin"
            checked={asAdmin}
            onCheckedChange={(value) => setAsAdmin(value === true)}
          />
          <Label htmlFor="login-admin" className="text-sm font-normal">
            Log in to the admin portal
          </Label>
        </div>

        <Button type="submit" variant="hero" size="lg" disabled={submitting}>
          {submitting ? "Signing in…" : "Log in"}
        </Button>
      </form>

      <Alert className="mt-6">
        <AlertTitle>Demo authentication</AlertTitle>
        <AlertDescription>
          Any email and password creates a local demo session so the dashboards can be reviewed.
          Real authentication arrives with the Cloudflare Workers backend.
        </AlertDescription>
      </Alert>
    </AuthLayout>
  );
}
