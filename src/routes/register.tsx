import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { siteConfig } from "@/config/site";
import { countries, guessTimezone, timezones } from "@/data/locations";
import { ApiError, authApi } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";

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

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [country, setCountry] = useState("AU");
  const [timezone, setTimezone] = useState(guessTimezone());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

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
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setSubmitting(true);
          setFormError(null);
          setFields({});
          try {
            const data = await authApi<{ user: Omit<AuthUser, "name">; devLink?: string }>(
              "register",
              {
                firstName: String(form.get("firstName") ?? ""),
                lastName: String(form.get("lastName") ?? ""),
                email: String(form.get("email") ?? ""),
                password: String(form.get("password") ?? ""),
                confirmPassword: String(form.get("confirmPassword") ?? ""),
                country,
                timezone,
                acceptTerms: accepted,
              },
            );
            setUser(data.user);
            toast.success("Account created — check your email to verify it.");
            if (data.devLink) console.info("Email verification link:", data.devLink);
            void navigate({ to: "/student" });
          } catch (error) {
            const apiError =
              error instanceof ApiError ? error : new ApiError(0, "Unable to register.");
            setFormError(apiError.message);
            setFields(apiError.fields);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {formError ? (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Registration failed</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="register-first-name">First name</Label>
            <Input
              id="register-first-name"
              name="firstName"
              autoComplete="given-name"
              required
              aria-invalid={Boolean(fields["firstName"])}
            />
            <FieldError message={fields["firstName"]} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="register-last-name">Last name</Label>
            <Input
              id="register-last-name"
              name="lastName"
              autoComplete="family-name"
              required
              aria-invalid={Boolean(fields["lastName"])}
            />
            <FieldError message={fields["lastName"]} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="register-email">Email address</Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(fields["email"])}
          />
          <FieldError message={fields["email"]} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="register-country">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="register-country">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fields["country"]} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="register-timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="register-timezone">
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={fields["timezone"]} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-describedby="register-password-hint"
            aria-invalid={Boolean(fields["password"])}
          />
          <p id="register-password-hint" className="text-xs text-muted-foreground">
            At least 10 characters with an uppercase letter, a lowercase letter and a number.
          </p>
          <FieldError message={fields["password"]} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="register-confirm-password">Confirm password</Label>
          <Input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(fields["confirmPassword"])}
          />
          <FieldError message={fields["confirmPassword"]} />
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="register-terms"
            checked={accepted}
            onCheckedChange={(value) => setAccepted(value === true)}
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
        <FieldError message={fields["acceptTerms"]} />

        <Button type="submit" variant="hero" size="lg" disabled={!accepted || submitting}>
          {submitting ? "Creating account…" : "Create free account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
