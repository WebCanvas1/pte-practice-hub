import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { moduleIcons } from "@/components/common/module-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { difficultyLevels, formatPrice, pricingConfig, siteConfig, testModules } from "@/config/site";

export const Route = createFileRoute("/test-modules")({
  head: () => ({
    meta: [
      { title: `Test modules — Speaking, Reading, Writing, Listening | ${siteConfig.name}` },
      {
        name: "description",
        content:
          "Explore PTE practice tests across Speaking, Reading, Writing and Listening in Easy, Intermediate and Hard levels.",
      },
      { property: "og:title", content: `PTE test modules — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Four modules, three difficulty levels, exam-aligned task types.",
      },
    ],
  }),
  component: TestModulesPage,
});

function TestModulesPage() {
  return (
    <PublicLayout>
      <section className="bg-soft-gradient">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Test modules</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Four PTE modules, each with three difficulty levels. Every module test is{" "}
            {formatPrice(pricingConfig.modulePrice)}, or take all four in a full mock for{" "}
            {formatPrice(pricingConfig.fullMockPrice)}.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {testModules.map((module) => {
            const Icon = moduleIcons[module.icon];
            return (
              <Card key={module.key} className="shadow-card">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <CardTitle className="text-xl">{module.name}</CardTitle>
                      <CardDescription>{module.blurb}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {module.taskCount} task types · ~{module.minutes} minutes ·{" "}
                    {formatPrice(pricingConfig.modulePrice)} {pricingConfig.labels.perTest}
                  </p>
                  <ul className="mt-4 grid gap-3">
                    {difficultyLevels.map((level) => (
                      <li
                        key={level.key}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{level.name}</p>
                          <p className="text-xs text-muted-foreground">{level.note}</p>
                        </div>
                        <Badge variant="secondary">{formatPrice(pricingConfig.modulePrice)}</Badge>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="mt-5 w-full">
                    <Link to="/register">Unlock {module.name} tests</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}
