import { createFileRoute } from "@tanstack/react-router";

import { ModuleScoreChart, ScoreTrendChart } from "@/components/common/charts";
import { PageHeader, ProgressStat, SectionCard } from "@/components/common/ui-blocks";
import { moduleScores, scoreTrend, studentStats } from "@/data/placeholder";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/student/progress")({
  head: () => ({ meta: [{ title: `Progress — ${siteConfig.name}` }] }),
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <>
      <PageHeader
        title="Progress"
        description={`Score trends against your target of ${studentStats.targetScore}. Placeholder data.`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Overall trend" description="Score by week">
          <ScoreTrendChart data={scoreTrend} />
        </SectionCard>
        <SectionCard title="By module" description="Latest score per module">
          <ModuleScoreChart data={moduleScores} />
        </SectionCard>
      </div>
      <div className="mt-6">
        <SectionCard title="Module breakdown" description="Distance to target">
          <div className="grid gap-5 sm:grid-cols-2">
            {moduleScores.map((m) => (
              <ProgressStat
                key={m.label}
                label={m.label}
                value={m.score}
                caption={`${Math.max(studentStats.targetScore - m.score, 0)} points to target`}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
