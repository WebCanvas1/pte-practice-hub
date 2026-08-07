import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Copy, Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { PageHeader, SectionCard, LoadingState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice, pricingConfig, siteConfig } from "@/config/site";
import { moduleLabels, type ModuleKey } from "@/config/questions";
import {
  estimatedMinutes,
  templateDifficultyLabels,
  templatePrice,
  testTypeLabels,
  typesForModule,
  type TemplateDifficulty,
  type TemplateValidation,
  type TestTemplateRecord,
  type TestType,
} from "@/config/tests";
import { ApiError } from "@/lib/api";
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  fetchAdminTemplates,
  generatePreview,
  setTemplateActive,
  updateTemplate,
  type GeneratePreviewResponse,
  type TemplateInput,
} from "@/lib/tests-api";

export const Route = createFileRoute("/admin/test-templates")({
  head: () => ({
    meta: [
      { title: `Test templates — ${siteConfig.name}` },
      {
        name: "description",
        content:
          "Compose module tests and complete mock tests from the question bank, validate coverage and preview generation.",
      },
      { property: "og:title", content: `Test templates — ${siteConfig.name}` },
      {
        property: "og:description",
        content: "Configure question distribution, time limits and pricing for every test template.",
      },
    ],
  }),
  component: TemplatesPage,
});

const emptyInput = (): TemplateInput => ({
  name: "",
  description: "",
  testType: "module",
  module: "speaking",
  difficulty: "intermediate",
  price: pricingConfig.modulePrice,
  currency: pricingConfig.currency,
  timeLimitMinutes: 30,
  targetScore: 65,
  instructions: "",
  isActive: false,
  purchasable: true,
  rules: [],
});

function TemplatesPage() {
  const [templates, setTemplates] = useState<TestTemplateRecord[] | null>(null);
  const [validations, setValidations] = useState<TemplateValidation[]>([]);
  const [storage, setStorage] = useState<"d1" | "memory">("memory");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editing, setEditing] = useState<{ id: string | null; input: TemplateInput } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratePreviewResponse | null>(null);

  const load = async () => {
    try {
      const result = await fetchAdminTemplates();
      setTemplates(result.templates);
      setValidations(result.validations);
      setStorage(result.storage);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load test templates.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const validationFor = (id: string) => validations.find((entry) => entry.templateId === id);

  const totals = useMemo(() => {
    const rows = templates ?? [];
    return {
      total: rows.length,
      active: rows.filter((row) => row.isActive).length,
      blocked: validations.filter((entry) => !entry.ok).length,
    };
  }, [templates, validations]);

  async function act(id: string, run: () => Promise<unknown>, success: string) {
    setBusyId(id);
    try {
      await run();
      toast.success(success);
      await load();
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function openPreview(id: string) {
    setBusyId(id);
    try {
      setPreview(await generatePreview(id));
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "Unable to preview generation.");
    } finally {
      setBusyId(null);
    }
  }

  function openEditor(template?: TestTemplateRecord) {
    setFormError(null);
    if (!template) {
      setEditing({ id: null, input: emptyInput() });
      return;
    }
    setEditing({
      id: template.id,
      input: {
        name: template.name,
        description: template.description,
        testType: template.testType,
        module: template.module,
        difficulty: template.difficulty,
        price: template.price,
        currency: template.currency,
        timeLimitMinutes: template.timeLimitMinutes,
        targetScore: template.targetScore,
        instructions: template.instructions,
        isActive: template.isActive,
        purchasable: template.purchasable,
        rules: template.rules.map((rule) => ({
          typeKey: rule.typeKey,
          questionCount: rule.questionCount,
          difficulty: rule.difficulty,
        })),
      },
    });
  }

  const patch = (changes: Partial<TemplateInput>) =>
    setEditing((current) => (current ? { ...current, input: { ...current.input, ...changes } } : current));

  function setRuleCount(typeKey: string, count: number) {
    setEditing((current) => {
      if (!current) return current;
      const rules = current.input.rules.filter((rule) => rule.typeKey !== typeKey);
      if (count > 0) rules.push({ typeKey, questionCount: count });
      return { ...current, input: { ...current.input, rules } };
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    const rules = editing.input.rules.filter((rule) => rule.questionCount > 0);
    const payload: TemplateInput = {
      ...editing.input,
      rules,
      module: editing.input.testType === "mock" ? null : editing.input.module,
    };
    try {
      if (rules.length === 0) throw new ApiError(400, "Set a question count for at least one task type.");
      if (editing.id) await updateTemplate(editing.id, payload, true);
      else await createTemplate(payload);
      toast.success(editing.id ? "Template updated." : "Template created.");
      setEditing(null);
      await load();
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : "Unable to save this template.");
    } finally {
      setSaving(false);
    }
  }

  const editorRules = editing
    ? typesForModule(editing.input.testType === "mock" ? null : editing.input.module)
    : [];
  const editorTotal = editing
    ? editing.input.rules.reduce((sum, rule) => sum + rule.questionCount, 0)
    : 0;

  return (
    <>
      <PageHeader
        title="Test templates"
        description="Compose module tests and complete mock tests from the question bank. Templates define task mix, timing, pricing and availability."
        actions={
          <Button variant="hero" onClick={() => openEditor()}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New template
          </Button>
        }
      />

      {error ? (
        <Alert variant="destructive" className="mb-6" role="alert">
          <AlertTitle>Could not load templates</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {totals.blocked > 0 ? (
        <Alert className="mb-6">
          <AlertTitle>{totals.blocked} template(s) cannot be generated yet</AlertTitle>
          <AlertDescription>
            The question bank does not hold enough published questions for every rule. Templates with
            shortfalls cannot be activated until the bank is topped up.
          </AlertDescription>
        </Alert>
      ) : null}

      {!templates ? (
        <LoadingState rows={5} label="Loading templates" />
      ) : (
        <SectionCard
          title="Templates"
          description={`${totals.total} templates · ${totals.active} active · storage: ${storage === "d1" ? "Cloudflare D1" : "in-memory (local dev)"}`}
        >
          <DataTable
            caption="Test templates"
            rows={templates}
            getRowKey={(row) => row.id}
            emptyTitle="No templates yet"
            emptyDescription="Create a template to define the task mix for a test."
            columns={[
              {
                key: "name",
                header: "Template",
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testTypeLabels[row.testType]} ·{" "}
                      {row.module ? moduleLabels[row.module] : "All modules"} ·{" "}
                      {templateDifficultyLabels[row.difficulty]} · v{row.version}
                    </p>
                  </div>
                ),
              },
              {
                key: "mix",
                header: "Questions",
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.questionCount}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.timeLimitMinutes} min limit · ~{estimatedMinutes(row.rules)} min of tasks
                    </p>
                  </div>
                ),
              },
              { key: "price", header: "Price", render: (row) => formatPrice(row.price) },
              {
                key: "coverage",
                header: "Bank coverage",
                render: (row) => {
                  const validation = validationFor(row.id);
                  if (!validation) return "—";
                  return validation.ok ? (
                    <Badge variant="success">
                      <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                      {validation.availableTotal}/{validation.requiredTotal}
                    </Badge>
                  ) : (
                    <Badge variant="warning" title={validation.warnings.join(" ")}>
                      <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
                      Short {validation.requiredTotal - validation.availableTotal}
                    </Badge>
                  );
                },
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={row.isActive}
                      aria-label={`${row.isActive ? "Deactivate" : "Activate"} ${row.name}`}
                      disabled={busyId === row.id}
                      onCheckedChange={(checked) =>
                        void act(
                          row.id,
                          () => setTemplateActive(row.id, checked),
                          checked ? "Template activated." : "Template deactivated.",
                        )
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                align: "right",
                render: (row) => (
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${row.name}`}
                      onClick={() => openEditor(row)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Preview generation for ${row.name}`}
                      disabled={busyId === row.id}
                      onClick={() => void openPreview(row.id)}
                    >
                      {busyId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Duplicate ${row.name}`}
                      disabled={busyId === row.id}
                      onClick={() =>
                        void act(row.id, () => duplicateTemplate(row.id), "Template duplicated.")
                      }
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${row.name}`}
                      disabled={busyId === row.id}
                      onClick={() => {
                        if (!window.confirm(`Delete “${row.name}”? Existing attempts are kept.`)) return;
                        void act(row.id, () => deleteTemplate(row.id), "Template deleted.");
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </SectionCard>
      )}

      {/* --------------------------- validation detail --------------------------- */}
      {validations.some((entry) => !entry.ok) ? (
        <div className="mt-6">
          <SectionCard
            title="Question bank coverage"
            description="Rules the generator cannot fill from published questions yet."
          >
            <ul className="grid gap-2 text-sm">
              {validations
                .filter((entry) => !entry.ok)
                .map((entry) => (
                  <li key={entry.templateId} className="rounded-lg border border-border p-3">
                    <p className="font-medium">
                      {templates?.find((row) => row.id === entry.templateId)?.name ?? entry.templateId}
                    </p>
                    <ul className="mt-1 grid gap-1 text-xs text-muted-foreground">
                      {entry.rules
                        .filter((rule) => rule.shortfall > 0)
                        .map((rule) => (
                          <li key={`${entry.templateId}-${rule.typeKey}`}>
                            {rule.typeName}: needs {rule.required}, {rule.available} published (
                            {rule.shortfall} short)
                          </li>
                        ))}
                    </ul>
                  </li>
                ))}
            </ul>
          </SectionCard>
        </div>
      ) : null}

      {/* ------------------------------- editor -------------------------------- */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => (open ? null : setEditing(null))}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit template" : "New template"}</DialogTitle>
            <DialogDescription>
              Set the test details and how many questions the generator must draw from each task type.
            </DialogDescription>
          </DialogHeader>

          {editing ? (
            <div className="grid gap-5">
              {formError ? (
                <Alert variant="destructive" role="alert">
                  <AlertTitle>Could not save</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="tpl-name">Name</Label>
                <Input
                  id="tpl-name"
                  value={editing.input.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="Speaking — Intermediate"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tpl-description">Description</Label>
                <Textarea
                  id="tpl-description"
                  rows={2}
                  value={editing.input.description}
                  onChange={(event) => patch({ description: event.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="tpl-type">Test type</Label>
                  <Select
                    value={editing.input.testType}
                    onValueChange={(value) =>
                      patch({
                        testType: value as TestType,
                        price: templatePrice(value as TestType),
                        ...(value === "mock" ? { module: null, difficulty: "mixed" as TemplateDifficulty } : {}),
                      })
                    }
                  >
                    <SelectTrigger id="tpl-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(testTypeLabels) as TestType[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {testTypeLabels[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tpl-module">Module</Label>
                  <Select
                    value={editing.input.module ?? "all"}
                    disabled={editing.input.testType === "mock"}
                    onValueChange={(value) =>
                      patch({ module: value === "all" ? null : (value as ModuleKey), rules: [] })
                    }
                  >
                    <SelectTrigger id="tpl-module">
                      <SelectValue />
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

                <div className="grid gap-2">
                  <Label htmlFor="tpl-difficulty">Difficulty</Label>
                  <Select
                    value={editing.input.difficulty}
                    onValueChange={(value) => patch({ difficulty: value as TemplateDifficulty })}
                  >
                    <SelectTrigger id="tpl-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(templateDifficultyLabels) as TemplateDifficulty[])
                        .filter((key) => key !== "mixed" || editing.input.testType === "mock")
                        .map((key) => (
                          <SelectItem key={key} value={key}>
                            {templateDifficultyLabels[key]}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="tpl-price">Price ({editing.input.currency})</Label>
                  <Input
                    id="tpl-price"
                    type="number"
                    min={0}
                    step="0.5"
                    value={editing.input.price}
                    onChange={(event) => patch({ price: Number(event.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tpl-time">Time limit (minutes)</Label>
                  <Input
                    id="tpl-time"
                    type="number"
                    min={1}
                    value={editing.input.timeLimitMinutes}
                    onChange={(event) => patch({ timeLimitMinutes: Number(event.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tpl-target">Target score</Label>
                  <Input
                    id="tpl-target"
                    type="number"
                    min={0}
                    max={90}
                    value={editing.input.targetScore ?? ""}
                    onChange={(event) =>
                      patch({ targetScore: event.target.value === "" ? null : Number(event.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tpl-instructions">Instructions shown to students</Label>
                <Textarea
                  id="tpl-instructions"
                  rows={2}
                  value={editing.input.instructions}
                  onChange={(event) => patch({ instructions: event.target.value })}
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="tpl-active"
                    checked={editing.input.isActive}
                    onCheckedChange={(checked) => patch({ isActive: checked })}
                  />
                  <Label htmlFor="tpl-active">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="tpl-purchasable"
                    checked={editing.input.purchasable}
                    onCheckedChange={(checked) => patch({ purchasable: checked })}
                  />
                  <Label htmlFor="tpl-purchasable">Available to purchase</Label>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Question distribution</p>
                    <p className="text-xs text-muted-foreground">
                      How many questions the generator must place from each task type.
                    </p>
                  </div>
                  <Badge variant="secondary">{editorTotal} questions</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {editorRules.map((type) => {
                    const rule = editing.input.rules.find((entry) => entry.typeKey === type.key);
                    return (
                      <div key={type.key} className="flex items-center gap-3">
                        <Label htmlFor={`rule-${type.key}`} className="flex-1 text-xs font-normal">
                          {type.name}
                        </Label>
                        <Input
                          id={`rule-${type.key}`}
                          type="number"
                          min={0}
                          max={60}
                          className="w-20"
                          value={rule?.questionCount ?? 0}
                          onChange={(event) => setRuleCount(type.key, Number(event.target.value))}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="hero" disabled={saving} onClick={() => void save()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {editing?.id ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------- generation preview ---------------------------- */}
      <Dialog open={Boolean(preview)} onOpenChange={(open) => (open ? null : setPreview(null))}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generation preview</DialogTitle>
            <DialogDescription>
              {preview?.template.name} — a simulated draw from the published question bank. No student
              attempt is created.
            </DialogDescription>
          </DialogHeader>

          {preview ? (
            <div className="grid gap-4">
              {preview.ok ? (
                <Alert>
                  <AlertTitle>Ready to generate</AlertTitle>
                  <AlertDescription>
                    {preview.questions.length} questions selected across{" "}
                    {new Set(preview.questions.map((question) => question.typeKey)).size} task types.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTitle>Cannot generate yet</AlertTitle>
                  <AlertDescription>{preview.warnings.join(" ")}</AlertDescription>
                </Alert>
              )}

              <DataTable
                caption="Preview questions"
                rows={preview.questions}
                getRowKey={(row) => `${row.position}-${row.id}`}
                emptyTitle="No questions could be selected"
                columns={[
                  { key: "position", header: "#", render: (row) => row.position },
                  { key: "type", header: "Task type", render: (row) => row.typeName },
                  { key: "title", header: "Question", render: (row) => row.title },
                  {
                    key: "difficulty",
                    header: "Level",
                    render: (row) => <Badge variant="secondary">{row.difficulty}</Badge>,
                  },
                  {
                    key: "time",
                    header: "Est.",
                    align: "right",
                    render: (row) => `${Math.round(row.estimatedSeconds / 60)} min`,
                  },
                ]}
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
