import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatPrice, pricingConfig, siteConfig } from "@/config/site";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: `Pricing — PTE practice tests from ${formatPrice(pricingConfig.modulePrice)} | ${siteConfig.name}` },
      {
        name: "description",
        content: `Module practice tests are ${formatPrice(pricingConfig.modulePrice)} each and a full mock test across all four PTE modules is ${formatPrice(pricingConfig.fullMockPrice)}.`,
      },
      { property: "og:title", content: `Pricing — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Pay per test. No subscriptions, no lock-in.",
      },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: pricingConfig.labels.moduleTest,
    price: formatPrice(pricingConfig.modulePrice),
    unit: pricingConfig.labels.perTest,
    features: [
      "One module: Speaking, Reading, Writing or Listening",
      "Choose Easy, Intermediate or Hard",
      "Automated scoring on submission",
      "AI feedback per task",
      "Attempt saved to your progress history",
    ],
    highlight: false,
  },
  {
    name: pricingConfig.labels.fullMock,
    price: formatPrice(pricingConfig.fullMockPrice),
    unit: "per mock test",
    features: [
      "All four modules, end to end",
      "Combined overall score report",
      "Per-module and criterion breakdown",
      "Full AI feedback and recommended drills",
      "Readiness estimate against your target score",
    ],
    highlight: true,
  },
];

function PricingPage() {
  return (
    <PublicLayout>
      <section className="bg-soft-gradient">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pricing</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Pay only for the tests you take. {pricingConfig.labels.taxNote}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.highlight ? "border-primary/30 shadow-card" : "shadow-card"}>
              <CardHeader>
                {plan.highlight ? (
                  <Badge variant="accent" className="w-fit">
                    Best value
                  </Badge>
                ) : null}
                <CardDescription className="mt-2">{plan.name}</CardDescription>
                <CardTitle className="text-3xl">
                  {plan.price}{" "}
                  <span className="text-sm font-normal text-muted-foreground">{plan.unit}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.highlight ? "hero" : "outline"}
                  className="mt-6 w-full"
                >
                  <Link to="/register">Create account</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Alert className="mt-8">
          <AlertTitle>Checkout is coming soon</AlertTitle>
          <AlertDescription>
            Accounts and test browsing are available now. Online payment is not enabled yet — contact{" "}
            <a className="text-primary hover:underline" href={`mailto:${siteConfig.supportEmail}`}>
              {siteConfig.supportEmail}
            </a>{" "}
            for early access.
          </AlertDescription>
        </Alert>
      </section>
    </PublicLayout>
  );
}
