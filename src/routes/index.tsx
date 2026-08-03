import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { moduleIcons } from "@/components/common/module-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { difficultyLevels, formatPrice, pricingConfig, siteConfig, testModules } from "@/config/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteConfig.name} — PTE practice tests from ${formatPrice(pricingConfig.modulePrice)}` },
      { name: "description", content: siteConfig.description },
      { property: "og:title", content: `${siteConfig.name} — AI-powered PTE practice tests` },
      { property: "og:description", content: siteConfig.description },
    ],
  }),
  component: HomePage,
});

const steps = [
  { title: "Create your free account", detail: "Register in under a minute — no card needed to browse." },
  { title: "Pick a module or full mock", detail: `Single modules ${formatPrice(pricingConfig.modulePrice)}, full mock ${formatPrice(pricingConfig.fullMockPrice)}.` },
  { title: "Sit the test under exam conditions", detail: "Real timers, real task types, real audio pacing." },
  { title: "Get scores and AI feedback", detail: "Automated scoring plus task-level guidance on what to fix next." },
];

const benefits = [
  { icon: Wallet, title: "Affordable by design", detail: `Pay per test from ${formatPrice(pricingConfig.modulePrice)} — no subscriptions, no lock-in.` },
  { icon: Target, title: "Target-score focused", detail: "Set your goal and see exactly which tasks hold your score back." },
  { icon: Clock, title: "Practise in short sessions", detail: "Single-module tests fit into a 30 minute study block." },
  { icon: ShieldCheck, title: "Exam-aligned content", detail: "Task types, timing and scoring mirror PTE Academic." },
];

const faqs = [
  {
    q: "How much does a practice test cost?",
    a: `Individual module tests are ${formatPrice(pricingConfig.modulePrice)} each and a complete mock test covering all four modules is ${formatPrice(pricingConfig.fullMockPrice)}. ${pricingConfig.labels.taxNote}`,
  },
  {
    q: "Do you cover all four PTE modules?",
    a: "Yes — Speaking, Reading, Writing and Listening, each with Easy, Intermediate and Hard levels so you can build up gradually.",
  },
  {
    q: "How does the AI feedback work?",
    a: "Once you submit, your responses are scored automatically and the AI explains what cost you marks — pronunciation, fluency, grammar, structure or accuracy — with a specific drill to run next.",
  },
  {
    q: "Is my progress saved?",
    a: "Every attempt is stored in your dashboard with score history, per-module trends and recommendations so you can see improvement over time.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Everything runs in your browser on desktop, tablet or mobile. A microphone is required for Speaking tasks.",
  },
];

function HomePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-soft-gradient">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Badge variant="accent" className="mb-4">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              AI-powered scoring and feedback
            </Badge>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Practice PTE from just{" "}
              <span className="text-brand-gradient">
                {pricingConfig.currencySymbol}
                {pricingConfig.modulePrice}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Exam-realistic Speaking, Reading, Writing and Listening tests with instant automated
              scoring, AI feedback and progress tracking. Pay only for the tests you take.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/register">
                  Create your free account
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/test-modules">Explore test modules</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "No subscription required",
                "Three difficulty levels",
                "Instant score report",
                "Track every attempt",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Score preview card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardDescription>Latest score report</CardDescription>
              <CardTitle className="text-3xl">
                72<span className="text-base font-normal text-muted-foreground">/90 overall</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                { label: "Speaking", value: 68 },
                { label: "Reading", value: 74 },
                { label: "Writing", value: 70 },
                { label: "Listening", value: 76 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-muted-foreground">{row.value}</span>
                  </div>
                  <Progress
                    value={(row.value / 90) * 100}
                    className="mt-2 h-2"
                    aria-label={`${row.label} score ${row.value} of 90`}
                  />
                </div>
              ))}
              <div className="rounded-xl bg-accent-soft p-4 text-sm text-accent">
                <p className="font-semibold">AI feedback</p>
                <p className="mt-1 text-accent/90">
                  Fluency is your fastest win — reduce hesitation in Describe Image and you gain an
                  estimated 4 points.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">The four PTE modules</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every module is available in {difficultyLevels.map((d) => d.name).join(", ")} levels, so you
          can start comfortable and build to above-exam difficulty.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {testModules.map((module) => {
            const Icon = moduleIcons[module.icon];
            return (
              <Card key={module.key} className="flex flex-col shadow-card">
                <CardHeader>
                  <span className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-lg">{module.name}</CardTitle>
                  <CardDescription>{module.blurb}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <p className="text-xs text-muted-foreground">
                    {module.taskCount} task types · ~{module.minutes} min
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatPrice(pricingConfig.modulePrice)}{" "}
                    <span className="font-normal text-muted-foreground">
                      {pricingConfig.labels.perTest}
                    </span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* AI feedback + progress tracking */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <Badge variant="info" className="w-fit">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                AI-powered feedback
              </Badge>
              <CardTitle className="mt-3 text-xl">Know exactly why you lost marks</CardTitle>
              <CardDescription>
                Scoring is only useful when it tells you what to do next. Each submitted task is
                assessed against PTE criteria and returned with plain-language guidance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm">
                {[
                  "Criterion-level breakdown: content, form, fluency, pronunciation, grammar, vocabulary",
                  "Sentence-level notes on written responses",
                  "Suggested drill for every weakness detected",
                  "Estimated score gain for each recommendation",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <Badge variant="accent" className="w-fit">
                <BarChart3 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Progress tracking
              </Badge>
              <CardTitle className="mt-3 text-xl">Watch your score curve move</CardTitle>
              <CardDescription>
                Your dashboard keeps every attempt, so improvement is measurable rather than a
                feeling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm">
                {[
                  "Overall and per-module score trends",
                  "Target score tracker with readiness estimate",
                  "Task-type accuracy heat map",
                  "Study streaks and time-on-task summaries",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link to="/how-it-works">
              See the full walkthrough
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Pricing summary */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Simple pricing</h2>
          <p className="mt-2 text-muted-foreground">
            Pay per test. {pricingConfig.labels.taxNote}
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardDescription>{pricingConfig.labels.moduleTest}</CardDescription>
                <CardTitle className="text-3xl">
                  {formatPrice(pricingConfig.modulePrice)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {pricingConfig.labels.perTest}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  One module, one difficulty level, full scoring and AI feedback.
                </p>
                <Button asChild variant="outline" className="mt-5 w-full">
                  <Link to="/pricing">View pricing details</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/30 shadow-card">
              <CardHeader>
                <Badge variant="accent" className="w-fit">
                  Best value
                </Badge>
                <CardDescription className="mt-2">{pricingConfig.labels.fullMock}</CardDescription>
                <CardTitle className="text-3xl">
                  {formatPrice(pricingConfig.fullMockPrice)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">per mock</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All four modules end to end with a combined score report.
                </p>
                <Button asChild variant="hero" className="mt-5 w-full">
                  <Link to="/register">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Why students choose us</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
                <benefit.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{benefit.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{benefit.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="mt-6">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="bg-brand-gradient rounded-2xl px-6 py-12 text-center shadow-card sm:px-12">
          <h2 className="text-2xl font-semibold text-primary-foreground sm:text-3xl">
            Ready to sit your first practice test?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            Create an account for free, then start with a single module for{" "}
            {formatPrice(pricingConfig.modulePrice)}.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="xl" variant="secondary">
              <Link to="/register">Register now</Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
