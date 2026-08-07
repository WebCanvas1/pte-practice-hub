import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ClipboardList, Loader2 } from "lucide-react";

import { PageHeader, SectionCard, EmptyState, LoadingState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { siteConfig } from "@/config/site";
import { moduleLabels } from "@/config/questions";
import {
  attemptGroups,
  attemptStatusLabels,
  attemptStatusVariant,
  templateDifficultyLabels,
  type AttemptStatus,
  type TestAttemptRecord,
} from "@/config/tests";
import { ApiError } from "@/lib/api";
import { fetchMyTests, startTest, type MyTestsResponse } from "@/lib/tests-api";

export const Route = createFileRoute("/student/my-tests")({
  head: () => ({
    meta: [
      { title: `My tests — ${siteConfig.name}` },
      {
        name: "description",
        content: "Your ready, in-progress, completed and expired PTE practice tests in one place.",
      },
      { property: "og:title", content: `My tests — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Resume an in-progress test or review your completed practice tests.",
      },
    ],
  }),
  component: MyTestsPage,
});

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

function MyTestsPage() {
  const [data, setData] = useState<MyTestsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setData(await fetchMyTests());
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load your tests.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    const attempts = data?.attempts ?? [];
    const map: Record<string, TestAttemptRecord[]> = {};
    for (const group of attemptGroups) {
      map[group.key] = attempts.filter((attempt) =>
        group.statuses.includes(attempt.status as AttemptStatus),
      );
    }
    return map;
  }, [data]);

  /** Entitlements that have not generated an attempt yet. */
  const pending = useMemo(
    () =>
      (data?.entitlements ?? []).filter(
        (entitlement) => entitlement.status === "active" && !entitlement.attemptId,
      ),
    [data],
  );

  const templateName = (templateId: string) =>
    (data?.templates ?? []).find((template) => template.id === templateId)?.name ?? templateId;

  async function handleStart(templateId: string, entitlementId: string) {
    setBusyId(entitlementId);
    try {
      const result = await startTest(templateId, entitlementId);
      toast.success(`Test generated with ${result.attempt.questionCount} questions.`);
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Unable to generate this test.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="My tests"
        description="Everything you own: ready to start, in progress, awaiting scoring, completed and expired."
        actions={
          <Button asChild variant="hero">
            <Link to="/student/browse-tests">Browse more tests</Link>
          </Button>
        }
      />

      {error ? (
        <Alert variant="destructive" className="mb-6" role="alert">
          <AlertTitle>Could not load your tests</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!data ? (
        <LoadingState rows={4} label="Loading your tests" />
      ) : (
        <div className="grid gap-6">
          {pending.length > 0 ? (
            <SectionCard
              title="Ready to generate"
              description="These tests are yours. Generating a test picks fresh published questions and locks a permanent snapshot."
            >
              <DataTable
                caption="Tests ready to generate"
                rows={pending}
                getRowKey={(row) => row.id}
                columns={[
                  { key: "name", header: "Test", render: (row) => templateName(row.templateId) },
                  { key: "created", header: "Added", render: (row) => formatDate(row.createdAt) },
                  {
                    key: "action",
                    header: "",
                    align: "right",
                    render: (row) => (
                      <Button
                        size="sm"
                        variant="hero"
                        disabled={busyId === row.id}
                        onClick={() => void handleStart(row.templateId, row.id)}
                      >
                        {busyId === row.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : null}
                        Generate & start
                      </Button>
                    ),
                  },
                ]}
              />
            </SectionCard>
          ) : null}

          <Tabs defaultValue={attemptGroups[0]!.key}>
            <TabsList className="flex-wrap">
              {attemptGroups.map((group) => (
                <TabsTrigger key={group.key} value={group.key}>
                  {group.label}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {(grouped[group.key] ?? []).length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {attemptGroups.map((group) => {
              const rows = grouped[group.key] ?? [];
              return (
                <TabsContent key={group.key} value={group.key} className="mt-4">
                  {rows.length === 0 ? (
                    <EmptyState
                      icon={ClipboardList}
                      title={`No tests ${group.label.toLowerCase()}`}
                      description="Tests you own will appear here as they move through the test lifecycle."
                      action={
                        <Button asChild variant="outline">
                          <Link to="/student/browse-tests">Browse tests</Link>
                        </Button>
                      }
                    />
                  ) : (
                    <DataTable
                      caption={`${group.label} tests`}
                      rows={rows}
                      getRowKey={(row) => row.id}
                      columns={[
                        {
                          key: "name",
                          header: "Test",
                          render: (row) => (
                            <div>
                              <p className="font-medium">{row.templateName}</p>
                              <p className="text-xs text-muted-foreground">
                                {row.module ? moduleLabels[row.module] : "All modules"} ·{" "}
                                {templateDifficultyLabels[row.difficulty]}
                              </p>
                            </div>
                          ),
                        },
                        {
                          key: "status",
                          header: "Status",
                          render: (row) => (
                            <Badge variant={attemptStatusVariant[row.status]}>
                              {attemptStatusLabels[row.status]}
                            </Badge>
                          ),
                        },
                        {
                          key: "progress",
                          header: "Progress",
                          render: (row) => (
                            <div className="min-w-32">
                              <Progress
                                value={
                                  row.questionCount > 0
                                    ? Math.round((row.answeredCount / row.questionCount) * 100)
                                    : 0
                                }
                                className="h-2"
                                aria-label={`${row.answeredCount} of ${row.questionCount} questions answered`}
                              />
                              <p className="mt-1 text-xs text-muted-foreground">
                                {row.answeredCount}/{row.questionCount} answered
                              </p>
                            </div>
                          ),
                        },
                        {
                          key: "score",
                          header: "Score",
                          render: (row) =>
                            row.totalScore === null ? "—" : Math.round(row.totalScore),
                        },
                        {
                          key: "started",
                          header: "Started",
                          align: "right",
                          render: (row) => formatDate(row.startedAt ?? row.createdAt),
                        },
                      ]}
                    />
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}
    </>
  );
}
