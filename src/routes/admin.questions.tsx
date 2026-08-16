import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, EmptyState, LoadingState } from "@/components/common/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import {
  difficultyLabels,
  moduleLabels,
  statusLabels,
  typeLabel,
  type QuestionRecord,
  type QuestionStatus,
} from "@/config/questions";
import { listQuestions } from "@/lib/questions-api";

export const Route = createFileRoute("/admin/questions")({
  head: () => ({ meta: [{ title: `Questions — ${siteConfig.name}` }] }),
  component: Page,
});
function Page() {
  const [rows, setRows] = useState<QuestionRecord[] | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuestionStatus | "all">("all");
  const load = async () => {
    const result = await listQuestions({ search, status, pageSize: 100, sort: "created_desc" });
    setRows(result.rows);
    setTotal(result.total);
  };
  useEffect(() => {
    void load();
  }, [status]);
  return (
    <>
      <PageHeader
        title="Questions"
        description="Live question bank across modules, task types and difficulty levels."
        actions={
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
              placeholder="Search prompt or ID"
            />
            <select
              className="rounded-md border bg-background px-3"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under review</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <Button onClick={() => void load()}>Search</Button>
          </div>
        }
      />
      <SectionCard title={`Question bank (${total})`} description="Data loaded directly from D1.">
        {!rows ? (
          <LoadingState rows={5} label="Loading questions" />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No matching questions"
            description="Change the filters or publish an approved import."
          />
        ) : (
          <div className="divide-y rounded-md border">
            {rows.map((q) => (
              <article key={q.id} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{moduleLabels[q.module]}</Badge>
                    <Badge variant="outline">{typeLabel(q.type)}</Badge>
                    <Badge variant="secondary">{difficultyLabels[q.difficulty]}</Badge>
                    <Badge
                      variant={
                        q.status === "published"
                          ? "success"
                          : q.status === "under_review"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {statusLabels[q.status]}
                    </Badge>
                  </div>
                  <h3 className="mt-2 font-medium">{q.title}</h3>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {q.prompt}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {q.id} · {q.sourceReference || "No source reference"}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>Version {q.version}</p>
                  <p className="text-muted-foreground">
                    Updated {new Date(q.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
