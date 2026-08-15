import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAttemptReviewDetail } from "@/lib/tests-api";

export const Route = createFileRoute("/student/review/$attemptId")({ component: Page });
const render = (value: unknown) =>
  typeof value === "string" ? value || "No response" : JSON.stringify(value, null, 2);
function Page() {
  const { attemptId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["review-detail", attemptId],
    queryFn: () => fetchAttemptReviewDetail(attemptId),
  });
  if (isLoading)
    return (
      <div className="grid min-h-64 place-items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Question review</h1>
        <p className="text-muted-foreground">Answers are only available after submission.</p>
      </div>
      {data?.questions.map((q) => (
        <Card key={q.attemptQuestionId}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>
                {q.position}. {q.title}
              </span>
              <Badge variant="secondary">
                {q.earned} / {q.maximum}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="font-medium">Your answer</p>
              <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                {render(q.studentAnswer)}
              </pre>
            </div>
            <div>
              <p className="font-medium">Correct answer</p>
              <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                {render(q.correctAnswer)}
              </pre>
            </div>
            {q.modelResponse && (
              <div>
                <p className="font-medium">Model response</p>
                <p className="text-sm text-muted-foreground">{q.modelResponse}</p>
              </div>
            )}
            <div>
              <p className="font-medium">Explanation</p>
              <p className="text-sm text-muted-foreground">
                {q.explanation || "No explanation supplied."}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="font-medium">AI or scoring feedback</p>
              <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                {render(q.aiFeedback)}
              </pre>
            </div>
            <div className="md:col-span-2">
              <p className="font-medium">Improvement suggestion</p>
              <p className="text-sm text-muted-foreground">
                {q.improvement || "Review the task instructions and try a similar question."}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button asChild variant="outline">
        <Link to="/student/results/$attemptId" params={{ attemptId }}>
          Back to results
        </Link>
      </Button>
    </div>
  );
}
