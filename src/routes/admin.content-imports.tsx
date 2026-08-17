import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionCard, EmptyState, LoadingState } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import { importApi, type ImportJob, type ImportedQuestion } from "@/lib/content-import-api";

export const Route = createFileRoute("/admin/content-imports")({
  head: () => ({ meta: [{ title: `Content imports — ${siteConfig.name}` }] }),
  component: Page,
});
function Page() {
  const [jobs, setJobs] = useState<ImportJob[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    job: ImportJob;
    questions: ImportedQuestion[];
    errors: { id: string; message: string }[];
  } | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const load = () => importApi<{ jobs: ImportJob[] }>("jobs").then((v) => setJobs(v.jobs));
  const open = async (id: string) => {
    setActive(id);
    const value = await importApi<typeof detail>(`detail?id=${encodeURIComponent(id)}`);
    setDetail(value);
    setSelected(new Set(value?.questions.filter((q) => q.selected).map((q) => q.id)));
  };
  useEffect(() => {
    void load();
  }, []);
  async function upload() {
    if (!files?.length) return;
    const form = new FormData();
    for (const file of files) form.append("files", file);
    const value = await importApi<{ jobId: string }>("upload", form);
    toast.success("Upload accepted.");
    await load();
    await open(value.jobId);
  }
  async function bulk(action: "approve" | "reject") {
    if (!selected.size) return;
    await importApi("bulk", { ids: [...selected], action });
    toast.success(`${selected.size} questions updated.`);
    if (active) await open(active);
  }
  return (
    <>
      <PageHeader
        title="AI-assisted content imports"
        description="Uploaded content is untrusted and never publishes without explicit administrator approval."
      />
      <SectionCard
        title="Upload source material"
        description="PDF, DOCX, TXT, CSV, XLSX, images, audio and ZIP; maximum 25 MB per file."
      >
        <div className="flex flex-wrap gap-3">
          <Input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.csv,.xlsx,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.zip"
            onChange={(e) => setFiles(e.target.files)}
          />
          <Button disabled={!files?.length} onClick={() => void upload()}>
            Upload and process
          </Button>
        </div>
      </SectionCard>
      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <SectionCard title="Import jobs" description="Processing and review status">
          {!jobs ? (
            <LoadingState rows={4} label="Loading imports" />
          ) : jobs.length === 0 ? (
            <EmptyState title="No imports yet" description="Upload source material to begin." />
          ) : (
            <div className="space-y-2">
              {jobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => void open(j.id)}
                  className={`w-full rounded-md border p-3 text-left ${active === j.id ? "border-primary" : ""}`}
                >
                  <div className="flex justify-between">
                    <strong>{j.id.slice(0, 12)}</strong>
                    <Badge variant="outline">{j.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {j.total_files} files · {j.total_questions} candidates · {j.progress}%
                  </p>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
        <SectionCard
          title="Review extracted questions"
          description="High confidence may be preselected, but approval is always manual."
        >
          {!detail ? (
            <EmptyState
              title="Select an import"
              description="Choose a job to inspect its extracted candidates."
            />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <Button onClick={() => void bulk("approve")} disabled={!selected.size}>
                  Approve selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void bulk("reject")}
                  disabled={!selected.size}
                >
                  Reject selected
                </Button>
                <Button
                  variant="hero"
                  onClick={async () => {
                    const result = await importApi<{ published: number }>("publish", {
                      id: detail.job.id,
                    });
                    toast.success(`${result.published} approved questions published.`);
                    await open(detail.job.id);
                  }}
                >
                  Publish approved
                </Button>
              </div>
              {detail.errors.length ? (
                <div className="mb-3 rounded-md border border-destructive/40 p-3 text-sm text-destructive">
                  {detail.errors.map((e) => (
                    <p key={e.id}>{e.message}</p>
                  ))}
                </div>
              ) : null}
              <div className="space-y-3">
                {detail.questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    checked={selected.has(q.id)}
                    toggle={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(q.id)) next.delete(q.id);
                        else next.add(q.id);
                        return next;
                      })
                    }
                    reload={() => (active ? open(active) : Promise.resolve())}
                  />
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </>
  );
}
function QuestionCard({
  question: q,
  checked,
  toggle,
  reload,
}: {
  question: ImportedQuestion;
  checked: boolean;
  toggle: () => void;
  reload: () => Promise<void>;
}) {
  const warnings = JSON.parse(q.warnings_json || "[]") as string[];
  return (
    <article className="rounded-md border p-4">
      <div className="flex items-start gap-3">
        <Checkbox checked={checked} onCheckedChange={toggle} aria-label="Select question" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                q.confidence_level === "high"
                  ? "success"
                  : q.confidence_level === "medium"
                    ? "warning"
                    : "secondary"
              }
            >
              {q.confidence_level} {Math.round(q.confidence * 100)}%
            </Badge>
            <Badge variant="outline">{q.module_key}</Badge>
            <Badge variant="outline">{q.type_key}</Badge>
            <Badge variant="outline">{q.difficulty}</Badge>
            {q.duplicate_score ? (
              <Badge variant="destructive">Duplicate {Math.round(q.duplicate_score * 100)}%</Badge>
            ) : null}
            <Badge variant="secondary">{q.review_status}</Badge>
          </div>
          <p className="mt-3 whitespace-pre-wrap font-medium">{q.prompt}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {q.file_name} · {q.source_location}
          </p>
          <a
            className="mt-2 inline-block text-sm text-primary underline"
            href={`/api/public/content-imports/asset?id=${encodeURIComponent(q.upload_id)}`}
            target="_blank"
            rel="noreferrer"
          >
            Open source preview
          </a>
          {q.correct_answer ? (
            <p className="mt-2 text-sm">
              <strong>Answer:</strong> {q.correct_answer}
            </p>
          ) : null}
          {q.model_answer ? (
            <p className="mt-2 text-sm">
              <strong>Model answer:</strong> {q.model_answer}
            </p>
          ) : null}
          {q.explanation ? (
            <p className="mt-2 text-sm">
              <strong>Explanation:</strong> {q.explanation}
            </p>
          ) : null}
          {warnings.map((w) => (
            <p key={w} className="mt-1 text-xs text-amber-700">
              ⚠ {w}
            </p>
          ))}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-primary">
              Edit classification and content
            </summary>
            <EditForm question={q} reload={reload} />
          </details>
        </div>
      </div>
    </article>
  );
}
function EditForm({
  question: q,
  reload,
}: {
  question: ImportedQuestion;
  reload: () => Promise<void>;
}) {
  const [prompt, setPrompt] = useState(q.prompt);
  const [module, setModule] = useState(q.module_key);
  const [type, setType] = useState(q.type_key);
  const [difficulty, setDifficulty] = useState(q.difficulty);
  return (
    <div className="mt-3 grid gap-2">
      <textarea
        className="min-h-28 rounded-md border bg-background p-2"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="grid gap-2 sm:grid-cols-3">
        <Input value={module} onChange={(e) => setModule(e.target.value)} />
        <Input value={type} onChange={(e) => setType(e.target.value)} />
        <Input value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
      </div>
      <Button
        size="sm"
        onClick={async () => {
          await importApi("edit", {
            id: q.id,
            prompt,
            module,
            type,
            difficulty,
            correctAnswer: q.correct_answer ?? "",
            modelAnswer: q.model_answer ?? "",
            explanation: q.explanation ?? "",
            tags: JSON.parse(q.tags_json || "[]"),
          });
          toast.success("Candidate updated.");
          await reload();
        }}
      >
        Save changes
      </Button>
    </div>
  );
}
