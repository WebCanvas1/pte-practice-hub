import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { PageHeader, SectionCard } from "@/components/common/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { recommendations } from "@/data/placeholder";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/student/ai-recommendations")({
  head: () => ({ meta: [{ title: `AI Recommendations — ${siteConfig.name}` }] }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  return (
    <>
      <PageHeader
        title="AI Recommendations"
        description="Generated from your most recent attempts. Placeholder content until AI evaluation is enabled."
      />
      <SectionCard title="Priority actions" description="Ordered by estimated score impact">
        <ul className="grid gap-4">
          {recommendations.map((rec) => (
            <li key={rec.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                <p className="text-sm font-semibold">{rec.title}</p>
                <Badge variant={rec.priority === "High" ? "warning" : "info"}>{rec.priority}</Badge>
                <Badge variant="secondary">{rec.module}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{rec.detail}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </>
  );
}
