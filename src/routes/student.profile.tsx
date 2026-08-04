import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader, SectionCard } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
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
import { countries, timezones } from "@/data/locations";
import { ApiError, authApi } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: `Profile — ${siteConfig.name}` },
      { name: "description", content: "Update your name, country and timezone." },
      { property: "og:title", content: `Profile — ${siteConfig.name}` },
      { property: "og:description", content: "Keep your study profile up to date." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [country, setCountry] = useState(user?.country ?? "AU");
  const [timezone, setTimezone] = useState(user?.timezone ?? "Australia/Sydney");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setCountry(user.country || "AU");
      setTimezone(user.timezone || "Australia/Sydney");
    }
  }, [user]);

  return (
    <>
      <PageHeader title="Profile" description="Your personal details and study preferences." />

      {user && !user.emailVerified ? (
        <Alert className="mb-6">
          <AlertTitle>Email not verified</AlertTitle>
          <AlertDescription>
            Verify your email from Account Settings to secure your account.
          </AlertDescription>
        </Alert>
      ) : null}

      <SectionCard title="Personal details" description="Shown on your reports and certificates.">
        <form
          className="grid gap-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSaving(true);
            setError(null);
            setFields({});
            try {
              const data = await authApi<{ user: Omit<AuthUser, "name"> }>("profile", {
                firstName: String(form.get("firstName") ?? ""),
                lastName: String(form.get("lastName") ?? ""),
                country,
                timezone,
              });
              setUser(data.user);
              toast.success("Profile updated");
            } catch (err) {
              const apiError = err instanceof ApiError ? err : new ApiError(0, "Unable to save.");
              setError(apiError.message);
              setFields(apiError.fields);
            } finally {
              setSaving(false);
            }
          }}
        >
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Could not save</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="profile-first-name">First name</Label>
              <Input
                id="profile-first-name"
                name="firstName"
                defaultValue={user?.firstName ?? ""}
                key={`first-${user?.firstName ?? ""}`}
                required
              />
              {fields["firstName"] ? (
                <p className="text-xs text-destructive">{fields["firstName"]}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-last-name">Last name</Label>
              <Input
                id="profile-last-name"
                name="lastName"
                defaultValue={user?.lastName ?? ""}
                key={`last-${user?.lastName ?? ""}`}
                required
              />
              {fields["lastName"] ? (
                <p className="text-xs text-destructive">{fields["lastName"]}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-email">Email address</Label>
            <Input id="profile-email" value={user?.email ?? ""} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              Contact {siteConfig.supportEmail} to change your sign-in email.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="profile-country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="profile-country">
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="profile-timezone">
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
            </div>
          </div>

          <div>
            <Button type="submit" variant="hero" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
