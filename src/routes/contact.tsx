import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact ${siteConfig.name} — support and enquiries` },
      {
        name: "description",
        content: `Get in touch with the ${siteConfig.name} team about practice tests, scoring, billing or partnerships.`,
      },
      { property: "og:title", content: `Contact ${siteConfig.name}` },
      { property: "og:description", content: "Questions about tests, scoring or billing? Contact us." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <PublicLayout>
      <section className="bg-soft-gradient">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Contact us</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We reply to student enquiries within one business day.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Send a message</CardTitle>
            <CardDescription>
              This form is not connected to a backend yet — messages are not delivered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitting(true);
                window.setTimeout(() => {
                  setSubmitting(false);
                  toast.success("Message captured (demo only)");
                }, 600);
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="contact-name">Full name</Label>
                  <Input id="contact-name" name="name" autoComplete="name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-email">Email address</Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact-topic">Topic</Label>
                <Select name="topic" defaultValue="tests">
                  <SelectTrigger id="contact-topic">
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tests">Practice tests</SelectItem>
                    <SelectItem value="scoring">Scoring and feedback</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="partnership">Schools and partnerships</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea id="contact-message" name="message" rows={6} required />
                <p id="contact-message-hint" className="text-xs text-muted-foreground">
                  Include your account email if your question is about a specific attempt.
                </p>
              </div>

              <Button type="submit" variant="hero" disabled={submitting} className="w-fit">
                {submitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Other ways to reach us</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <p className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
              <a className="text-primary hover:underline" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
            </p>
            <p className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-muted-foreground">{siteConfig.supportPhone}</span>
            </p>
            <p className="text-muted-foreground">{siteConfig.company.address}</p>
          </CardContent>
        </Card>
      </section>
    </PublicLayout>
  );
}
