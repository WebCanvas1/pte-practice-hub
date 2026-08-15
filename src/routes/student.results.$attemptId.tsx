import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock3, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchAttemptResult } from "@/lib/tests-api";

export const Route = createFileRoute("/student/results/$attemptId")({
  component: AttemptResultsPage,
});

function AttemptResultsPage() {
  const { attemptId } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["attempt-result", attemptId],
    queryFn: () => fetchAttemptResult(attemptId),
  });

  if (isLoading)
    return (
      <div className="grid min-h-72 place-items-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  if (error || !data)
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Results unavailable</AlertTitle>
        <AlertDescription>We could not load this result yet.</AlertDescription>
      </Alert>
    );

  const result = data.result;
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Test results</h1>
        <p className="mt-1 text-muted-foreground">
          Internal practice performance—not an official Pearson PTE score.
        </p>
      </div>

      {result.status === "pending_ai" && (
        <Alert>
          <Clock3 className="size-4" />
          <AlertTitle>AI evaluation pending</AlertTitle>
          <AlertDescription>
            Scored sections are ready. Any remaining AI-evaluated questions are still pending.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Overall practice score</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-4xl font-semibold">{result.overall.percentage}%</p>
          <Progress value={result.overall.percentage} />
          <p className="text-sm text-muted-foreground">
            {result.overall.earned} of {result.overall.maximum} currently scored points
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(result.modules).map(([module, score]) => (
          <Card key={module}>
            <CardHeader>
              <CardTitle className="capitalize">{module}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{score.percentage}%</p>
              <p className="text-sm text-muted-foreground">
                {score.earned} / {score.maximum}
              </p>
              {score.status === "pending_ai" && (
                <Badge variant="secondary" className="mt-2">
                  AI pending
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {result.questions.map((question, index) => (
            <div key={question.attemptQuestionId} className="grid gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                {question.outcome === "pending_ai" ? (
                  <Clock3 className="size-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="size-4 text-primary" />
                )}
                <span className="flex-1">
                  Question {index + 1} · {question.typeKey.replaceAll("_", " ")}
                </span>
                <Badge variant="secondary">
                  {question.outcome === "pending_ai"
                    ? "Pending"
                    : `${question.earned} / ${question.maximum}`}
                </Badge>
              </div>
              {question.breakdown?.summary && (
                <div className="grid gap-3 border-t pt-3 text-sm">
                  <p>{question.breakdown.summary}</p>
                  {question.breakdown.transcript && (
                    <div className="rounded-md border p-2">
                      <p className="font-medium">Speech transcript</p>
                      <p className="text-muted-foreground">{question.breakdown.transcript}</p>
                    </div>
                  )}
                  {question.breakdown.criteria?.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {question.breakdown.criteria.map((criterion) => (
                        <div key={criterion.name} className="rounded-md bg-muted p-2">
                          <p className="font-medium capitalize">
                            {criterion.name.replaceAll("_", " ")} · {criterion.score}/5
                          </p>
                          <p className="text-muted-foreground">{criterion.feedback}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {question.breakdown.improvements?.length ? (
                    <div>
                      <p className="font-medium">Next improvements</p>
                      <ul className="list-disc pl-5 text-muted-foreground">
                        {question.breakdown.improvements.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {question.breakdown.acousticEstimateNotice && (
                    <p className="text-xs text-muted-foreground">
                      {question.breakdown.acousticEstimateNotice}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link to="/student/test-history">View test history</Link>
      </Button>
    </div>
  );
}
