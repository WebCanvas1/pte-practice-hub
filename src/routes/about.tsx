import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, Target, Users } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, pricingConfig, siteConfig } from "@/config/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About ${siteConfig.name} — affordable PTE preparation` },
      {
        name: "description",
        content: `${siteConfig.name} makes exam-realistic PTE practice affordable, with AI feedback and progress tracking for students preparing for study, work and migration.`,
      },
      { property: "og:title", content: `About ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Our mission: high-quality PTE practice that students can actually afford.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Target,
    title: "Exam realism first",
    body: "Task types, timing and scoring criteria follow PTE Academic so practice results are meaningful.",
  },
  {
    icon: HeartHandshake,
    title: "Affordable access",
    body: `Practice should not cost hundreds of dollars. Tests start at ${formatPrice(pricingConfig.modulePrice)}.`,
  },
  {
    icon: Users,
    title: "Student-led roadmap",
    body: "Features are prioritised from student feedback — clearer feedback, faster scoring, better tracking.",
  },
];

function AboutPage() {
  return (
    <PublicLayout>
      <section className="bg-soft-gradient">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">About {siteConfig.name}</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            We build affordable, exam-realistic PTE practice tests with automated scoring and AI
            feedback, so students can see exactly where their score is and what to fix next.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((value) => (
            <Card key={value.title} className="shadow-card">
              <CardHeader>
                <span className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
                  <value.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <CardTitle className="text-lg">{value.title}</CardTitle>
                <CardDescription>{value.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="mt-10 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Company details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">Legal name:</span>{" "}
              {siteConfig.company.legalName}
            </p>
            <p>
              <span className="font-medium text-foreground">ABN:</span> {siteConfig.company.abn}
            </p>
            <p>
              <span className="font-medium text-foreground">Location:</span>{" "}
              {siteConfig.company.address}
            </p>
            <p>
              <span className="font-medium text-foreground">Support:</span>{" "}
              <a className="text-primary hover:underline" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
            </p>
          </CardContent>
        </Card>
      </section>
    </PublicLayout>
  );
}
