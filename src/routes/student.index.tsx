import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Flame, Sparkles, Target, Trophy } from "lucide-react";

import { DataTable } from "@/components/common/DataTable";
import { ModuleScoreChart, ScoreTrendChart } from "@/components/common/charts";
import { PageHeader, ProgressStat, SectionCard, StatCard } from "@/components/common/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { moduleScores, myTests, scoreTrend, studentStats, testHistory } from "@/data/placeholder";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/student/")({
  head: () => ({ meta: [{ title: `Student dashboard — ${siteConfig.name}` }] }),
  component: StudentOverview,
});

function StudentOverview() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name ?? "student"}`}
        description="Placeholder data is shown until the backend is connected."
        actions={
          <Button asChild variant="hero">
            <Link to="/student/browse-tests">Browse tests</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tests completed" value={String(studentStats.testsCompleted)} icon={Trophy} />
        <StatCard
          label="Average score"
          value={`${studentStats.averageScore}/90`}
          icon={Target}
          trend={{ value: "+6 this month", positive: true }}
        />
        <StatCard label="Test credits" value={String(studentStats.credits)} icon={BookOpen} hint="unused" />
        <StatCard label="Study streak" value={`${studentStats.streakDays} days`} icon={Flame} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Score trend" description="Overall score across recent attempts">
          <ScoreTrendChart data={scoreTrend} />
        </SectionCard>
        <SectionCard title="Module performance" description="Latest score per module">
          <ModuleScoreChart data={moduleScores} />
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Progress to target"
          description={`Target score ${studentStats.targetScore}`}
        >
          <div className="grid gap-5">
            {moduleScores.map((m) => (
              <ProgressStat key={m.label} label={m.label} value={m.score} />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Continue where you left off"
          description="Tests in your library"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link to="/student/my-tests">View all</Link>
            </Button>
          }
        >
          <ul className="grid gap-3">
            {myTests.map((test) => (
              <li key={test.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{test.title}</p>
                  <Badge variant={test.progress > 0 ? "info" : "secondary"}>{test.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{test.module}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Next AI recommendation"
          description="Generated after your latest attempt"
          actions={<Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />}
        >
          <div className="rounded-lg bg-accent-soft p-4 text-sm text-accent">
            <p className="font-semibold">Speaking · fluency</p>
            <p className="mt-1">
              Reduce hesitation in Describe Image with three timed attempts using a 25 second plan.
            </p>
          </div>
          <Button asChild variant="soft" className="mt-4 w-full">
            <Link to="/student/ai-recommendations">See all recommendations</Link>
          </Button>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Recent attempts" description="Your last four scored tests">
          <DataTable
            caption="Recent test attempts"
            rows={testHistory}
            getRowKey={(row) => row.id}
            columns={[
              { key: "test", header: "Test", render: (r) => r.title },
              { key: "module", header: "Module", render: (r) => r.module },
              { key: "date", header: "Date", render: (r) => r.date },
              {
                key: "score",
                header: "Score",
                align: "right",
                render: (r) => <span className="font-medium">{r.score}/90</span>,
              },
            ]}
          />
        </SectionCard>
      </div>
    </>
  );
}
