import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CalendarDays, Clock3, Trophy } from "lucide-react";
import { ModuleScoreChart, ScoreTrendChart } from "@/components/common/charts";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
import { fetchProgress } from "@/lib/tests-api";

export const Route = createFileRoute("/student/progress")({ component: ProgressPage });
function ProgressPage() {
  const { data, isLoading } = useQuery({ queryKey: ["progress"], queryFn: fetchProgress });
  const p = data?.progress;
  if (!isLoading && (!p || p.completedTests === 0))
    return (
      <>
        <PageHeader title="Progress" description="Your verified performance trends." />
        <EmptyState
          title="No completed tests yet"
          description="Complete a scored test to unlock progress charts and weak-skill trends."
          action={
            <Button asChild>
              <Link to="/student/browse-tests">Browse tests</Link>
            </Button>
          }
        />
      </>
    );
  if (!p) return <PageHeader title="Progress" description="Loading your verified performance…" />;
  return (
    <div className="grid gap-6">
      <PageHeader title="Progress" description="Charts use completed attempts from your account." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Completed tests" value={String(p.completedTests)} icon={Trophy} />
        <StatCard label="Study streak" value={`${p.streak} days`} icon={CalendarDays} />
        <StatCard
          label="Average question time"
          value={`${Math.round(p.averageCompletionSeconds)} sec`}
          icon={Clock3}
        />
        <StatCard
          label="First → latest"
          value={`${p.firstScore} → ${p.latestScore}`}
          icon={Activity}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Estimated score over time" description="Practice estimate out of 90">
          <ScoreTrendChart data={p.trend} />
        </SectionCard>
        <SectionCard title="Module progress" description="Accuracy percentage">
          <ModuleScoreChart data={p.modules} />
        </SectionCard>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Accuracy by question type" description="All completed questions">
          <ModuleScoreChart data={p.questionTypes} />
        </SectionCard>
        <SectionCard title="Difficulty performance" description="Easy, Intermediate and Hard">
          <ModuleScoreChart data={p.difficulties} />
        </SectionCard>
      </div>
      <SectionCard title="Weak-skill trends" description="Lowest verified accuracy">
        <div className="grid gap-2 sm:grid-cols-2">
          {p.weakTrends.map((row) => (
            <div key={row.label} className="flex justify-between rounded-md border p-3">
              <span>{row.label}</span>
              <strong>{row.score}%</strong>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Recent results" description="Your latest completed tests">
        <div className="grid gap-2">
          {p.recent.map((row) => (
            <Link
              key={row.id}
              to="/student/results/$attemptId"
              params={{ attemptId: row.id }}
              className="flex justify-between rounded-md border p-3 hover:bg-muted"
            >
              <span>
                {row.name}
                <small className="block text-muted-foreground">
                  {new Date(row.date).toLocaleDateString("en-AU")}
                </small>
              </span>
              <strong>{row.score}/90</strong>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
