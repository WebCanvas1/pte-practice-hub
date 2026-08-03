import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: `Create your account — ${siteConfig.name}` },
      {
        name: "description",
        content: `Register free with ${siteConfig.name} and start PTE practice tests with AI feedback and progress tracking.`,
      },
      { property: "og:title", content: `Create your account — ${siteConfig.name}` },
      { property: "og:description", content: "Free registration. Pay per practice test." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  return (
    <AuthLayout
      title="Create your account"
      description="Registration is free — you only pay when you take a test."
      footer={
        <p className="text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      }
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          register(String(form.get("name") ?? "Student"), String(form.get("email") ?? ""));
          toast.success("Account created (demo session)");
          void navigate({ to: "/student" });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="register-name">Full name</Label>
          <Input id="register-name" name="name" autoComplete="name" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="register-email">Email address</Label>
          <Input id="register-email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="register-target">Target PTE score</Label>
          <Select name="target" defaultValue="79">
            <SelectTrigger id="register-target">
              <SelectValue placeholder="Select a target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50 — general</SelectItem>
              <SelectItem value="58">58 — study pathway</SelectItem>
              <SelectItem value="65">65 — university entry</SelectItem>
              <SelectItem value="79">79 — superior English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="register-password-hint"
          />
          <p id="register-password-hint" className="text-xs text-muted-foreground">
            Use at least 8 characters with a number.
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="register-terms"
            checked={accepted}
            onCheckedChange={(value) => setAccepted(value === true)}
            required
          />
          <Label htmlFor="register-terms" className="text-sm font-normal leading-snug">
            I agree to the{" "}
            <Link to="/terms-and-conditions" className="text-primary hover:underline">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link to="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </Label>
        </div>

        <Button type="submit" variant="hero" size="lg" disabled={!accepted}>
          Create free account
        </Button>
      </form>
    </AuthLayout>
  );
}
