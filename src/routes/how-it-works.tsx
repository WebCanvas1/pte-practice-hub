import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, pricingConfig, siteConfig } from "@/config/site";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: `How it works — ${siteConfig.name}` },
      {
        name: "description",
        content:
          "From registration to AI feedback: how practice tests, automated scoring and progress tracking work step by step.",
      },
      { property: "og:title", content: `How it works — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Register, choose a test, sit it under exam conditions and get AI feedback.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const stages = [
  {
    title: "1. Register a free account",
    body: "Sign up with your email. Your dashboard is created instantly with your score history, purchases and recommendations in one place.",
  },
  {
    title: "2. Choose a test",
    body: `Browse by module and difficulty. Single module tests are ${formatPrice(pricingConfig.modulePrice)}; a complete mock covering all four modules is ${formatPrice(pricingConfig.fullMockPrice)}.`,
  },
  {
    title: "3. Sit the test",
    body: "Tests run in the browser with exam timers, authentic task instructions and native-speed audio. Speaking tasks record directly from your microphone.",
  },
  {
    title: "4. Receive automated scoring",
    body: "Objective tasks are marked immediately. Speaking and Writing responses are assessed against PTE criteria for content, form, fluency, pronunciation, grammar and vocabulary.",
  },
  {
    title: "5. Read your AI feedback",
    body: "Each task comes back with what went wrong, why it cost marks, and the specific drill to run next — plus an estimated score gain.",
  },
  {
    title: "6. Track progress to your target",
    body: "Your dashboard plots score trends per module, flags weak task types and updates your readiness estimate after every attempt.",
  },
];

function HowItWorksPage() {
  return (
    <PublicLayout>
      <section className="bg-soft-gradient">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Six steps from sign-up to a measurable score improvement. No subscription, no software to
            install.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <ol className="grid gap-5">
          {stages.map((stage) => (
            <li key={stage.title}>
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">{stage.title}</CardTitle>
                  <CardDescription className="text-base">{stage.body}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>

        <Card className="mt-10 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Ready when you are</CardTitle>
            <CardDescription>
              Questions first? Email{" "}
              <a className="text-primary hover:underline" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="hero">
              <Link to="/register">
                Create free account
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/test-modules">Browse modules</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PublicLayout>
  );
}
