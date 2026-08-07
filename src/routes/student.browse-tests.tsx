import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Clock, ListChecks, Loader2, ShoppingCart } from "lucide-react";

import { PageHeader, EmptyState, LoadingState } from "@/components/common/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatPrice, pricingConfig, siteConfig } from "@/config/site";
import { moduleLabels, type ModuleKey } from "@/config/questions";
import {
  templateDifficultyLabels,
  testTypeLabels,
  type TemplateDifficulty,
  type TestType,
} from "@/config/tests";
import { ApiError } from "@/lib/api";
import {
  entitleTest,
  fetchCatalogue,
  startTest,
  type CatalogueResponse,
  type CatalogueTemplate,
} from "@/lib/tests-api";

export const Route = createFileRoute("/student/browse-tests")({
  head: () => ({
    meta: [
      { title: `Browse tests — ${siteConfig.name}` },
      {
        name: "description",
        content: `Browse PTE module tests and complete mock tests from ${formatPrice(1)} and start practising straight away.`,
      },
      { property: "og:title", content: `Browse tests — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Pick a module test or a complete four-module mock test and start practising.",
      },
    ],
  }),
  component: BrowseTestsPage,
});

function BrowseTestsPage() {
  const [data, setData] = useState<CatalogueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState<ModuleKey | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TestType | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<TemplateDifficulty | "all">("all");

  const load = async () => {
    try {
      setData(await fetchCatalogue());
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load the test catalogue.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const templates = useMemo(() => {
    const rows = data?.templates ?? [];
    return rows.filter(
      (template) =>
        (moduleFilter === "all" || template.module === moduleFilter) &&
        (typeFilter === "all" || template.testType === typeFilter) &&
        (difficultyFilter === "all" || template.difficulty === difficultyFilter),
    );
  }, [data, moduleFilter, typeFilter, difficultyFilter]);

  const entitlementFor = (templateId: string) =>
    (data?.entitlements ?? []).find(
      (entitlement) => entitlement.templateId === templateId && entitlement.status === "active",
    );

  async function handleGet(template: CatalogueTemplate) {
    setBusyId(template.id);
    try {
      const result = await entitleTest(template.id);
      toast.success(
        result.reused ? "You already have this test ready to start." : "Test added to My Tests.",
      );
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Unable to add this test.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleStart(template: CatalogueTemplate) {
    const entitlement = entitlementFor(template.id);
    if (!entitlement) return;
    setBusyId(template.id);
    try {
      const result = await startTest(template.id, entitlement.id);
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
        title="Browse tests"
        description={`Individual module tests from ${formatPrice(pricingConfig.modulePrice)} and complete mock tests covering all four modules.`}
        actions={
          <Button asChild variant="outline">
            <Link to="/student/my-tests">My tests</Link>
          </Button>
        }
      />

      {error ? (
        <Alert variant="destructive" className="mb-6" role="alert">
          <AlertTitle>Could not load tests</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-type">
            Test type
          </label>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TestType | "all")}>
            <SelectTrigger id="filter-type">
              <SelectValue placeholder="All test types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All test types</SelectItem>
              {(Object.keys(testTypeLabels) as TestType[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {testTypeLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-module">
            Module
          </label>
          <Select
            value={moduleFilter}
            onValueChange={(value) => setModuleFilter(value as ModuleKey | "all")}
          >
            <SelectTrigger id="filter-module">
              <SelectValue placeholder="All modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {(Object.keys(moduleLabels) as ModuleKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {moduleLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="filter-difficulty">
            Difficulty
          </label>
          <Select
            value={difficultyFilter}
            onValueChange={(value) => setDifficultyFilter(value as TemplateDifficulty | "all")}
          >
            <SelectTrigger id="filter-difficulty">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {(Object.keys(templateDifficultyLabels) as TemplateDifficulty[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {templateDifficultyLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!data ? (
        <LoadingState rows={4} label="Loading tests" />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tests match these filters"
          description="Try clearing the filters, or check back soon — new tests are added regularly."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setModuleFilter("all");
                setTypeFilter("all");
                setDifficultyFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const entitlement = entitlementFor(template.id);
            const busy = busyId === template.id;
            return (
              <Card key={template.id} className="flex flex-col shadow-card">
                <CardHeader>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{testTypeLabels[template.testType]}</Badge>
                    {template.module ? (
                      <Badge variant="outline">{moduleLabels[template.module]}</Badge>
                    ) : (
                      <Badge variant="outline">All modules</Badge>
                    )}
                    <Badge variant="info">{templateDifficultyLabels[template.difficulty]}</Badge>
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Questions</dt>
                      <dd className="font-medium">{template.questionCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Time limit</dt>
                      <dd className="flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        {template.timeLimitMinutes} min
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Estimated</dt>
                      <dd className="font-medium">{template.estimatedMinutes} min of tasks</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Target score</dt>
                      <dd className="font-medium">{template.targetScore ?? "—"}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {template.types
                      .filter((type) => type.questionCount > 0)
                      .map((type) => `${type.typeName} × ${type.questionCount}`)
                      .join(" · ")}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-lg font-semibold">{formatPrice(template.price)}</span>
                  {entitlement ? (
                    <Button variant="hero" disabled={busy} onClick={() => void handleStart(template)}>
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : null}
                      Start test
                    </Button>
                  ) : (
                    <Button variant="default" disabled={busy} onClick={() => void handleGet(template)}>
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                      )}
                      Get this test
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
