import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionCard, LoadingState } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, type PlatformSettings } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/platform-settings")({ component: Page });
const field = (label: string, value: string, set: (value: string) => void, type = "text") => (
  <div className="grid gap-2">
    <Label>{label}</Label>
    <Input type={type} value={value} onChange={(e) => set(e.target.value)} />
  </div>
);
const area = (label: string, value: string, set: (value: string) => void) => (
  <div className="grid gap-2">
    <Label>{label}</Label>
    <Textarea rows={5} value={value} onChange={(e) => set(e.target.value)} />
  </div>
);

function Page() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    void adminApi<{ settings: PlatformSettings }>("settings")
      .then((x) => setSettings(x.settings))
      .catch((e) => toast.error(e.message));
  }, []);
  const update = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await adminApi<{ settings: PlatformSettings }>("settings", settings);
      setSettings(result.settings);
      toast.success("Platform settings saved and audited.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };
  if (!settings) return <LoadingState rows={8} label="Loading platform settings" />;
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Platform Settings"
        description="Live configuration stored in D1. Secret keys remain in Cloudflare environment secrets."
        actions={
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save all changes"}
          </Button>
        }
      />
      <SectionCard
        title="Brand and contact"
        description="Platform identity, homepage and reporting defaults"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {field("Platform name", settings.platform.name, (name) =>
            update("platform", { ...settings.platform, name }),
          )}
          {field(
            "Support email",
            settings.platform.supportEmail,
            (supportEmail) => update("platform", { ...settings.platform, supportEmail }),
            "email",
          )}
          {field("Logo URL", settings.platform.logoUrl, (logoUrl) =>
            update("platform", { ...settings.platform, logoUrl }),
          )}
          {field("Favicon URL", settings.platform.faviconUrl, (faviconUrl) =>
            update("platform", { ...settings.platform, faviconUrl }),
          )}
          {field("Currency", settings.platform.currency, (currency) =>
            update("platform", { ...settings.platform, currency }),
          )}
          {field("Contact details", settings.platform.contactDetails, (contactDetails) =>
            update("platform", { ...settings.platform, contactDetails }),
          )}
          <div className="md:col-span-2">
            {area("Homepage content", settings.platform.homepageContent, (homepageContent) =>
              update("platform", { ...settings.platform, homepageContent }),
            )}
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title="Availability"
        description="Control registration, maintenance and test availability"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Tests available", "tests"],
              ["Registration open", "registrationOpen"],
              ["Maintenance mode", "maintenanceMode"],
            ] as const
          ).map(([label, key]) => (
            <label key={key} className="flex items-center justify-between rounded-lg border p-3">
              <span>{label}</span>
              <Switch
                checked={settings.availability[key]}
                onCheckedChange={(value) =>
                  update("availability", { ...settings.availability, [key]: value })
                }
              />
            </label>
          ))}
          {Object.entries(settings.availability.modules).map(([key, value]) => (
            <label key={key} className="flex items-center justify-between rounded-lg border p-3">
              <span className="capitalize">{key} module</span>
              <Switch
                checked={value}
                onCheckedChange={(enabled) =>
                  update("availability", {
                    ...settings.availability,
                    modules: { ...settings.availability.modules, [key]: enabled },
                  })
                }
              />
            </label>
          ))}
          {Object.entries(settings.availability.difficulties).map(([key, value]) => (
            <label key={key} className="flex items-center justify-between rounded-lg border p-3">
              <span className="capitalize">{key}</span>
              <Switch
                checked={value}
                onCheckedChange={(enabled) =>
                  update("availability", {
                    ...settings.availability,
                    difficulties: { ...settings.availability.difficulties, [key]: enabled },
                  })
                }
              />
            </label>
          ))}
          {field(
            "Default duration (minutes)",
            String(settings.availability.defaultTestDuration),
            (value) =>
              update("availability", {
                ...settings.availability,
                defaultTestDuration: Math.max(1, Number(value)),
              }),
            "number",
          )}
        </div>
      </SectionCard>
      <SectionCard
        title="Pricing"
        description="Server-authoritative prices in cents; checkout never trusts browser prices"
      >
        <div className="grid gap-3">
          {settings.pricing.map((price, index) => (
            <div
              key={price.productId}
              className="grid items-end gap-3 rounded-lg border p-3 md:grid-cols-[1fr_160px_100px_auto]"
            >
              <div>
                <Label>{price.name}</Label>
                <p className="text-xs text-muted-foreground">{price.productId}</p>
              </div>
              {field(
                "Amount (cents)",
                String(price.amount),
                (value) => {
                  const pricing = [...settings.pricing];
                  pricing[index] = { ...price, amount: Math.max(0, Number(value)) };
                  update("pricing", pricing);
                },
                "number",
              )}
              {field("Currency", price.currency, (currency) => {
                const pricing = [...settings.pricing];
                pricing[index] = { ...price, currency };
                update("pricing", pricing);
              })}
              <Switch
                checked={price.active}
                onCheckedChange={(active) => {
                  const pricing = [...settings.pricing];
                  pricing[index] = { ...price, active };
                  update("pricing", pricing);
                }}
              />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Legal and disclaimers">
        <div className="grid gap-4 md:grid-cols-2">
          {area("Terms and Conditions", settings.legal.terms, (terms) =>
            update("legal", { ...settings.legal, terms }),
          )}
          {area("Privacy Policy", settings.legal.privacy, (privacy) =>
            update("legal", { ...settings.legal, privacy }),
          )}
          {area("Disclaimer", settings.legal.disclaimer, (disclaimer) =>
            update("legal", { ...settings.legal, disclaimer }),
          )}
          {area(
            "Practice-score disclaimer",
            settings.legal.practiceScoreDisclaimer,
            (practiceScoreDisclaimer) =>
              update("legal", { ...settings.legal, practiceScoreDisclaimer }),
          )}
        </div>
      </SectionCard>
      <SectionCard
        title="AI and retention"
        description="Provider preferences only—API keys are never returned to the browser"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {field("AI provider", settings.ai.provider, (provider) =>
            update("ai", { ...settings.ai, provider }),
          )}
          {field("Writing model", settings.ai.writingModel, (writingModel) =>
            update("ai", { ...settings.ai, writingModel }),
          )}
          {field("Speaking model", settings.ai.speakingModel, (speakingModel) =>
            update("ai", { ...settings.ai, speakingModel }),
          )}
          {field("Transcription model", settings.ai.transcriptionModel, (transcriptionModel) =>
            update("ai", { ...settings.ai, transcriptionModel }),
          )}
          {field(
            "Audio retention (days)",
            String(settings.operations.audioRetentionDays),
            (value) =>
              update("operations", {
                ...settings.operations,
                audioRetentionDays: Math.max(1, Number(value)),
              }),
            "number",
          )}
          {Object.entries(settings.operations.minimumQuestionPool).map(([key, value]) =>
            field(
              `${key} minimum questions`,
              String(value),
              (next) =>
                update("operations", {
                  ...settings.operations,
                  minimumQuestionPool: {
                    ...settings.operations.minimumQuestionPool,
                    [key]: Math.max(1, Number(next)),
                  },
                }),
              "number",
            ),
          )}
        </div>
      </SectionCard>
      <SectionCard title="Email templates and report branding">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(settings.emailTemplates).map(([key, template]) => (
            <div key={key} className="grid gap-2 rounded-lg border p-3">
              <h3 className="font-medium capitalize">{key}</h3>
              {field("Subject", template.subject, (subject) =>
                update("emailTemplates", {
                  ...settings.emailTemplates,
                  [key]: { ...template, subject },
                }),
              )}
              {area("Body", template.body, (body) =>
                update("emailTemplates", {
                  ...settings.emailTemplates,
                  [key]: { ...template, body },
                }),
              )}
            </div>
          ))}
          <div className="grid gap-3 rounded-lg border p-3">
            {field("Report title", settings.reportBranding.title, (title) =>
              update("reportBranding", { ...settings.reportBranding, title }),
            )}
            {field("Report logo", settings.reportBranding.logoUrl, (logoUrl) =>
              update("reportBranding", { ...settings.reportBranding, logoUrl }),
            )}
            {area("Report footer", settings.reportBranding.footer, (footer) =>
              update("reportBranding", { ...settings.reportBranding, footer }),
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
