import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader, SectionCard } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { siteConfig } from "@/config/site";
import { ApiError, authApi } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/student/account-settings")({
  head: () => ({
    meta: [
      { title: `Account Settings — ${siteConfig.name}` },
      { name: "description", content: "Change your password, sessions and email preferences." },
      { property: "og:title", content: `Account Settings — ${siteConfig.name}` },
      { property: "og:description", content: "Security, notifications and data controls." },
    ],
  }),
  component: AccountSettingsPage,
});

function AccountSettingsPage() {
  const { user, setUser, signOutEverywhere } = useAuth();
  const navigate = useNavigate();
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const updatePrefs = async (patch: { marketing?: boolean; product?: boolean }) => {
    if (!user) return;
    setBusy("prefs");
    try {
      const data = await authApi<{ user: Omit<AuthUser, "name"> }>("email-preferences", {
        marketing: patch.marketing ?? user.emailPreferences.marketing,
        product: patch.product ?? user.emailPreferences.product,
      });
      setUser(data.user);
      toast.success("Email preferences saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unable to save preferences.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title="Account Settings" description="Password, sessions and data controls." />

      <div className="grid gap-6">
        <SectionCard title="Change password" description="You'll stay signed in on this device.">
          <form
            className="grid max-w-md gap-5"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const el = event.currentTarget;
              setSavingPassword(true);
              setPasswordError(null);
              setFields({});
              try {
                await authApi("change-password", {
                  currentPassword: String(form.get("currentPassword") ?? ""),
                  password: String(form.get("password") ?? ""),
                  confirmPassword: String(form.get("confirmPassword") ?? ""),
                });
                el.reset();
                toast.success("Password changed — other devices were signed out.");
              } catch (error) {
                const apiError =
                  error instanceof ApiError ? error : new ApiError(0, "Unable to change password.");
                setPasswordError(apiError.message);
                setFields(apiError.fields);
              } finally {
                setSavingPassword(false);
              }
            }}
          >
            {passwordError ? (
              <Alert variant="destructive" role="alert">
                <AlertTitle>Could not change password</AlertTitle>
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
              {fields["currentPassword"] ? (
                <p className="text-xs text-destructive">{fields["currentPassword"]}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="settings-new-password">New password</Label>
              <Input
                id="settings-new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                aria-describedby="settings-password-hint"
              />
              <p id="settings-password-hint" className="text-xs text-muted-foreground">
                At least 10 characters with upper and lowercase letters and a number.
              </p>
              {fields["password"] ? (
                <p className="text-xs text-destructive">{fields["password"]}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="settings-confirm-password">Confirm new password</Label>
              <Input
                id="settings-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
              {fields["confirmPassword"] ? (
                <p className="text-xs text-destructive">{fields["confirmPassword"]}</p>
              ) : null}
            </div>
            <div>
              <Button type="submit" variant="hero" disabled={savingPassword}>
                {savingPassword ? "Updating…" : "Update password"}
              </Button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Email preferences" description="Choose what we send you.">
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="pref-product" className="font-normal">
                Test results, score reports and account emails
              </Label>
              <Switch
                id="pref-product"
                checked={user?.emailPreferences.product ?? true}
                disabled={busy === "prefs"}
                onCheckedChange={(value) => void updatePrefs({ product: value })}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="pref-marketing" className="font-normal">
                Study tips, new content and offers
              </Label>
              <Switch
                id="pref-marketing"
                checked={user?.emailPreferences.marketing ?? false}
                disabled={busy === "prefs"}
                onCheckedChange={(value) => void updatePrefs({ marketing: value })}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Email verification" description="Confirm your address to secure access.">
          {user?.emailVerified ? (
            <Alert>
              <AlertTitle>Email verified</AlertTitle>
              <AlertDescription>{user.email} is confirmed.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                We haven't confirmed {user?.email ?? "your email"} yet.
              </p>
              <div>
                <Button
                  variant="outline"
                  disabled={busy === "verify"}
                  onClick={async () => {
                    setBusy("verify");
                    try {
                      const data = await authApi<{ devLink?: string }>("resend-verification", {});
                      if (data.devLink) console.info("Verification link:", data.devLink);
                      toast.success("Verification email sent");
                    } catch (error) {
                      toast.error(
                        error instanceof ApiError ? error.message : "Unable to send email.",
                      );
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  {busy === "verify" ? "Sending…" : "Resend verification email"}
                </Button>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Sessions" description="Sign out everywhere if you've used a shared device.">
          <Button
            variant="outline"
            disabled={busy === "logout"}
            onClick={async () => {
              setBusy("logout");
              try {
                await signOutEverywhere();
                toast.success("Signed out of all devices");
                void navigate({ to: "/login" });
              } finally {
                setBusy(null);
              }
            }}
          >
            {busy === "logout" ? "Signing out…" : "Log out of all devices"}
          </Button>
        </SectionCard>

        <SectionCard title="Delete account" description="Request permanent deletion of your data.">
          {user?.deletionRequested ? (
            <Alert>
              <AlertTitle>Deletion requested</AlertTitle>
              <AlertDescription>
                Our team will confirm by email within 30 days. Contact {siteConfig.supportEmail} to
                cancel.
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              variant="destructive"
              disabled={busy === "delete"}
              onClick={async () => {
                setBusy("delete");
                try {
                  const data = await authApi<{ user: Omit<AuthUser, "name"> }>(
                    "request-deletion",
                    {},
                  );
                  setUser(data.user);
                  toast.success("Deletion request submitted");
                } catch (error) {
                  toast.error(error instanceof ApiError ? error.message : "Unable to submit.");
                } finally {
                  setBusy(null);
                }
              }}
            >
              {busy === "delete" ? "Submitting…" : "Request account deletion"}
            </Button>
          )}
        </SectionCard>
      </div>
    </>
  );
}
