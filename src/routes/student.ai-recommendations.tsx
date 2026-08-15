import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { fetchRecommendations } from "@/lib/tests-api";

export const Route = createFileRoute("/student/ai-recommendations")({ component: Page });
function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
    staleTime: 3600000,
  });
  const r = data?.recommendations;
  return (
    <div className="grid gap-6">
      <PageHeader
        title="AI Recommendations"
        description="Verified metrics interpreted as an understandable study plan."
      />
      {!r ? (
        <SectionCard
          title="Preparing recommendations"
          description={isLoading ? "Analysing completed attempts…" : "Complete a test to begin."}
        >
          <p className="text-muted-foreground">No recommendation available yet.</p>
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="Recommended action"
            description="AI wording grounded only in database metrics"
          >
            <div className="flex gap-3">
              <Sparkles className="mt-1 size-5 text-primary" />
              <p>{r.narrative}</p>
            </div>
          </SectionCard>
          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard title="Current strengths" description="Highest verified accuracy">
              {r.strengths.length ? (
                r.strengths.map((x) => (
                  <Badge className="mr-2 mb-2" key={x} variant="success">
                    {x}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">Not enough data.</p>
              )}
            </SectionCard>
            <SectionCard title="Current weaknesses" description="Priority question types">
              {r.weaknesses.length ? (
                r.weaknesses.map((x) => (
                  <Badge className="mr-2 mb-2" key={x} variant="warning">
                    {x}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">Not enough data.</p>
              )}
            </SectionCard>
          </div>
          <SectionCard title="Next test and frequency" description="Deterministic recommendation">
            <p className="font-medium">{r.nextTest}</p>
            <p className="text-muted-foreground">{r.frequency}</p>
          </SectionCard>
          <SectionCard title="Seven-day study plan" description="Focused practice schedule">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {r.plan.map((day) => (
                <div key={day.day} className="rounded-lg border p-3">
                  <Badge variant="secondary">Day {day.day}</Badge>
                  <p className="mt-2 font-medium">{day.focus}</p>
                  <p className="text-sm text-muted-foreground">{day.activity}</p>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard
            title="Recent recommendation history"
            description="Latest generated guidance"
          >
            <div className="grid gap-2">
              {r.history.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <p>{item.narrative}</p>
                  <small className="text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString("en-AU")}
                  </small>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
