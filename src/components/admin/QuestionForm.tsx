/**
 * Dynamic question editor.
 *
 * The visible fields are derived from the selected task type's capabilities
 * (see src/config/questions.ts), so multiple-choice items get options,
 * Re-order Paragraphs gets ordered blocks, fill-in-the-blanks gets blanks and
 * a word bank, Describe Image requires an image, listening tasks require audio
 * and essay tasks expose word limits and scoring criteria.
 */
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/common/ui-blocks";
import {
  difficultyKeys,
  difficultyLabels,
  moduleKeys,
  moduleLabels,
  questionTypeMap,
  typesForModule,
  type DifficultyKey,
  type ModuleKey,
  type QuestionBlank,
  type QuestionContent,
  type QuestionOptionInput,
  type QuestionOrderingBlock,
  type QuestionRecord,
} from "@/config/questions";
import type { ApiFieldErrors } from "@/lib/api";

export interface QuestionDraft {
  module: ModuleKey;
  type: string;
  difficulty: DifficultyKey;
  title: string;
  instructions: string;
  prompt: string;
  passage: string;
  correctAnswer: string;
  alternativeAnswers: string[];
  modelAnswer: string;
  explanation: string;
  scoringConfig: Record<string, unknown>;
  scoreWeight: number;
  topic: string;
  tags: string[];
  estimatedSeconds: number;
  sourceReference: string;
  adminNotes: string;
  aiConfidence: number | null;
  content: QuestionContent;
  options: QuestionOptionInput[];
  audio: { url: string; transcript: string; durationSeconds: number | null } | null;
  image: { url: string; altText: string } | null;
}

export function emptyDraft(type = "read_aloud"): QuestionDraft {
  const def = questionTypeMap[type]!;
  return {
    module: def.module,
    type: def.key,
    difficulty: "easy",
    title: "",
    instructions: def.description,
    prompt: "",
    passage: "",
    correctAnswer: "",
    alternativeAnswers: [],
    modelAnswer: "",
    explanation: "",
    scoringConfig: {
      criteria: Object.fromEntries(def.scoringCriteria.map((key) => [key, 1])),
      maxScore: def.scoringCriteria.length * 5,
    },
    scoreWeight: 1,
    topic: "",
    tags: [],
    estimatedSeconds: def.estimatedSeconds,
    sourceReference: "",
    adminNotes: "",
    aiConfidence: null,
    content: def.capabilities.writtenResponse ? { wordLimit: { min: 50, max: 300 } } : {},
    options: def.capabilities.options
      ? [1, 2, 3, 4].map((n) => ({
          label: String.fromCharCode(64 + n),
          content: "",
          isCorrect: false,
          position: n,
        }))
      : [],
    audio: def.capabilities.audio ? { url: "", transcript: "", durationSeconds: null } : null,
    image: def.capabilities.image ? { url: "", altText: "" } : null,
  };
}

export function draftFromRecord(record: QuestionRecord): QuestionDraft {
  return {
    module: record.module,
    type: record.type,
    difficulty: record.difficulty,
    title: record.title,
    instructions: record.instructions,
    prompt: record.prompt,
    passage: record.passage,
    correctAnswer: record.correctAnswer,
    alternativeAnswers: record.alternativeAnswers,
    modelAnswer: record.modelAnswer,
    explanation: record.explanation,
    scoringConfig: record.scoringConfig,
    scoreWeight: record.scoreWeight,
    topic: record.topic,
    tags: record.tags,
    estimatedSeconds: record.estimatedSeconds,
    sourceReference: record.sourceReference,
    adminNotes: record.adminNotes,
    aiConfidence: record.aiConfidence,
    content: record.content,
    options: record.options,
    audio: record.audio
      ? {
          url: record.audio.url,
          transcript: record.audio.transcript ?? "",
          durationSeconds: record.audio.durationSeconds,
        }
      : null,
    image: record.image ? { url: record.image.url, altText: record.image.altText ?? "" } : null,
  };
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

interface Props {
  value: QuestionDraft;
  onChange: (next: QuestionDraft) => void;
  errors?: ApiFieldErrors | undefined;
}

export function QuestionForm({ value, onChange, errors = {} }: Props) {
  const def = questionTypeMap[value.type];
  const cap = def?.capabilities ?? {};
  const set = <K extends keyof QuestionDraft>(key: K, next: QuestionDraft[K]) =>
    onChange({ ...value, [key]: next });
  const setContent = (patch: Partial<QuestionContent>) =>
    onChange({ ...value, content: { ...value.content, ...patch } });

  const typeOptions = useMemo(() => typesForModule(value.module), [value.module]);
  const blanks: QuestionBlank[] = value.content.blanks ?? [];
  const ordering: QuestionOrderingBlock[] = value.content.ordering ?? [];

  return (
    <div className="grid gap-6">
      <SectionCard title="Classification" description="Module, task type and difficulty.">
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="q-module">Module</Label>
            <Select
              value={value.module}
              onValueChange={(next) => {
                const module = next as ModuleKey;
                const firstType = typesForModule(module)[0]!;
                onChange({
                  ...emptyDraft(firstType.key),
                  title: value.title,
                  topic: value.topic,
                  tags: value.tags,
                  difficulty: value.difficulty,
                });
              }}
            >
              <SelectTrigger id="q-module">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moduleKeys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {moduleLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="q-type">Question type</Label>
            <Select
              value={value.type}
              onValueChange={(next) =>
                onChange({
                  ...emptyDraft(next),
                  title: value.title,
                  topic: value.topic,
                  tags: value.tags,
                  difficulty: value.difficulty,
                })
              }
            >
              <SelectTrigger id="q-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors["type"]} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="q-difficulty">Difficulty</Label>
            <Select
              value={value.difficulty}
              onValueChange={(next) => set("difficulty", next as DifficultyKey)}
            >
              <SelectTrigger id="q-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficultyKeys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {difficultyLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Question content" description={def?.description ?? ""}>
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="q-title">Title</Label>
            <Input
              id="q-title"
              value={value.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
            <FieldError message={errors["title"]} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="q-instructions">Instructions shown to the student</Label>
            <Textarea
              id="q-instructions"
              rows={2}
              value={value.instructions}
              onChange={(e) => set("instructions", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="q-prompt">Prompt / question</Label>
            <Textarea
              id="q-prompt"
              rows={3}
              value={value.prompt}
              onChange={(e) => set("prompt", e.target.value)}
            />
          </div>

          {cap.passage || cap.highlightWords ? (
            <div className="grid gap-2">
              <Label htmlFor="q-passage">
                {cap.highlightWords ? "Transcript shown to the student" : "Passage or transcript"}
              </Label>
              <Textarea
                id="q-passage"
                rows={7}
                value={value.passage}
                onChange={(e) => set("passage", e.target.value)}
              />
              {cap.blanks ? (
                <p className="text-xs text-muted-foreground">
                  Mark blanks inline using <code>[[1]]</code>, <code>[[2]]</code> and so on.
                </p>
              ) : null}
              <FieldError message={errors["passage"]} />
            </div>
          ) : null}

          {cap.audio ? (
            <div className="grid gap-5 rounded-xl border border-border p-4">
              <p className="text-sm font-medium">Audio asset (required)</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="q-audio-url">Audio URL (R2 object or CDN link)</Label>
                  <Input
                    id="q-audio-url"
                    type="url"
                    value={value.audio?.url ?? ""}
                    onChange={(e) =>
                      set("audio", {
                        url: e.target.value,
                        transcript: value.audio?.transcript ?? "",
                        durationSeconds: value.audio?.durationSeconds ?? null,
                      })
                    }
                  />
                  <FieldError message={errors["audio"]} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="q-audio-duration">Duration (seconds)</Label>
                  <Input
                    id="q-audio-duration"
                    type="number"
                    min={0}
                    value={value.audio?.durationSeconds ?? ""}
                    onChange={(e) =>
                      set("audio", {
                        url: value.audio?.url ?? "",
                        transcript: value.audio?.transcript ?? "",
                        durationSeconds: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              {cap.transcript ? (
                <div className="grid gap-2">
                  <Label htmlFor="q-audio-transcript">Expected transcript</Label>
                  <Textarea
                    id="q-audio-transcript"
                    rows={3}
                    value={value.audio?.transcript ?? ""}
                    onChange={(e) =>
                      set("audio", {
                        url: value.audio?.url ?? "",
                        transcript: e.target.value,
                        durationSeconds: value.audio?.durationSeconds ?? null,
                      })
                    }
                  />
                  <FieldError message={errors["transcript"]} />
                </div>
              ) : null}
            </div>
          ) : null}

          {cap.image ? (
            <div className="grid gap-5 rounded-xl border border-border p-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="q-image-url">Image URL (required)</Label>
                <Input
                  id="q-image-url"
                  type="url"
                  value={value.image?.url ?? ""}
                  onChange={(e) =>
                    set("image", { url: e.target.value, altText: value.image?.altText ?? "" })
                  }
                />
                <FieldError message={errors["image"]} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="q-image-alt">Alt text</Label>
                <Input
                  id="q-image-alt"
                  value={value.image?.altText ?? ""}
                  onChange={(e) =>
                    set("image", { url: value.image?.url ?? "", altText: e.target.value })
                  }
                />
              </div>
            </div>
          ) : null}

          {cap.options ? (
            <div className="grid gap-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  Options ({cap.options === "single" ? "one correct answer" : "multiple correct answers"})
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    set("options", [
                      ...value.options,
                      {
                        label: String.fromCharCode(65 + value.options.length),
                        content: "",
                        isCorrect: false,
                        position: value.options.length + 1,
                      },
                    ])
                  }
                >
                  Add option
                </Button>
              </div>
              {value.options.map((option, index) => (
                <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    aria-label={`Option ${index + 1} text`}
                    value={option.content}
                    onChange={(e) => {
                      const next = [...value.options];
                      next[index] = { ...option, content: e.target.value };
                      set("options", next);
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={option.isCorrect}
                        onCheckedChange={(checked) => {
                          const isCorrect = checked === true;
                          const next = value.options.map((item, i) =>
                            cap.options === "single"
                              ? { ...item, isCorrect: i === index ? isCorrect : false }
                              : i === index
                                ? { ...item, isCorrect }
                                : item,
                          );
                          set("options", next);
                        }}
                        aria-label={`Option ${index + 1} is correct`}
                      />
                      Correct
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        set(
                          "options",
                          value.options
                            .filter((_, i) => i !== index)
                            .map((item, i) => ({
                              ...item,
                              label: String.fromCharCode(65 + i),
                              position: i + 1,
                            })),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <FieldError message={errors["options"]} />
            </div>
          ) : null}

          {cap.ordering ? (
            <div className="grid gap-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Text blocks in correct order</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setContent({
                      ordering: [
                        ...ordering,
                        {
                          key: `blk_${ordering.length + 1}`,
                          content: "",
                          correctPosition: ordering.length + 1,
                        },
                      ],
                    })
                  }
                >
                  Add block
                </Button>
              </div>
              {ordering.map((block, index) => (
                <div key={block.key} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <span className="pt-2 text-sm font-medium text-muted-foreground">{index + 1}.</span>
                  <Textarea
                    aria-label={`Block ${index + 1} text`}
                    rows={2}
                    value={block.content}
                    onChange={(e) => {
                      const next = [...ordering];
                      next[index] = { ...block, content: e.target.value };
                      setContent({ ordering: next });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setContent({
                        ordering: ordering
                          .filter((_, i) => i !== index)
                          .map((item, i) => ({ ...item, correctPosition: i + 1 })),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <FieldError message={errors["ordering"]} />
            </div>
          ) : null}

          {cap.blanks ? (
            <div className="grid gap-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Blanks and correct mappings</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setContent({
                      blanks: [...blanks, { index: blanks.length + 1, answer: "", choices: [] }],
                    })
                  }
                >
                  Add blank
                </Button>
              </div>
              {blanks.map((blank, index) => (
                <div key={blank.index} className="grid gap-2 sm:grid-cols-[80px_1fr_1fr_auto] sm:items-end">
                  <div className="grid gap-1">
                    <Label className="text-xs">Marker</Label>
                    <Input value={`[[${blank.index}]]`} readOnly />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs" htmlFor={`blank-answer-${index}`}>
                      Correct answer
                    </Label>
                    <Input
                      id={`blank-answer-${index}`}
                      value={blank.answer}
                      onChange={(e) => {
                        const next = [...blanks];
                        next[index] = { ...blank, answer: e.target.value };
                        setContent({ blanks: next });
                      }}
                    />
                  </div>
                  {cap.blankChoices ? (
                    <div className="grid gap-1">
                      <Label className="text-xs" htmlFor={`blank-choices-${index}`}>
                        Available choices (comma separated)
                      </Label>
                      <Input
                        id={`blank-choices-${index}`}
                        value={blank.choices.join(", ")}
                        onChange={(e) => {
                          const next = [...blanks];
                          next[index] = {
                            ...blank,
                            choices: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          };
                          setContent({ blanks: next });
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Typed answer</span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setContent({
                        blanks: blanks
                          .filter((_, i) => i !== index)
                          .map((item, i) => ({ ...item, index: i + 1 })),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <FieldError message={errors["blanks"]} />
            </div>
          ) : null}

          {cap.highlightWords ? (
            <div className="grid gap-2">
              <Label htmlFor="q-incorrect-words">
                Words that differ from the recording (comma separated)
              </Label>
              <Input
                id="q-incorrect-words"
                value={(value.content.incorrectWords ?? []).join(", ")}
                onChange={(e) =>
                  setContent({
                    incorrectWords: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          ) : null}

          {cap.writtenResponse ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="q-word-min">Minimum words</Label>
                <Input
                  id="q-word-min"
                  type="number"
                  min={0}
                  value={value.content.wordLimit?.min ?? 0}
                  onChange={(e) =>
                    setContent({
                      wordLimit: {
                        min: Number(e.target.value || 0),
                        max: value.content.wordLimit?.max ?? 300,
                      },
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="q-word-max">Maximum words</Label>
                <Input
                  id="q-word-max"
                  type="number"
                  min={1}
                  value={value.content.wordLimit?.max ?? 300}
                  onChange={(e) =>
                    setContent({
                      wordLimit: {
                        min: value.content.wordLimit?.min ?? 0,
                        max: Number(e.target.value || 1),
                      },
                    })
                  }
                />
                <FieldError message={errors["wordLimit"]} />
              </div>
            </div>
          ) : null}

          {cap.spokenResponse ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="q-prep">Preparation time (seconds)</Label>
                <Input
                  id="q-prep"
                  type="number"
                  min={0}
                  value={value.content.preparationSeconds ?? 0}
                  onChange={(e) => setContent({ preparationSeconds: Number(e.target.value || 0) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="q-record">Recording time (seconds)</Label>
                <Input
                  id="q-record"
                  type="number"
                  min={0}
                  value={value.content.recordingSeconds ?? 0}
                  onChange={(e) => setContent({ recordingSeconds: Number(e.target.value || 0) })}
                />
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Answers and feedback" description="Used by automated scoring and AI feedback.">
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="q-correct">Correct answer</Label>
            <Textarea
              id="q-correct"
              rows={2}
              value={value.correctAnswer}
              onChange={(e) => set("correctAnswer", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="q-alts">Alternative accepted answers (one per line)</Label>
            <Textarea
              id="q-alts"
              rows={2}
              value={value.alternativeAnswers.join("\n")}
              onChange={(e) =>
                set(
                  "alternativeAnswers",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="q-model">Model answer</Label>
            <Textarea
              id="q-model"
              rows={3}
              value={value.modelAnswer}
              onChange={(e) => set("modelAnswer", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="q-explanation">Explanation</Label>
            <Textarea
              id="q-explanation"
              rows={3}
              value={value.explanation}
              onChange={(e) => set("explanation", e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Scoring and metadata" description="Weighting, timing, tagging and internal notes.">
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="q-weight">Score weight</Label>
              <Input
                id="q-weight"
                type="number"
                step="0.5"
                min={0}
                value={value.scoreWeight}
                onChange={(e) => set("scoreWeight", Number(e.target.value || 0))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="q-seconds">Estimated completion time (seconds)</Label>
              <Input
                id="q-seconds"
                type="number"
                min={5}
                value={value.estimatedSeconds}
                onChange={(e) => set("estimatedSeconds", Number(e.target.value || 5))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="q-confidence">AI confidence score (0–1)</Label>
              <Input
                id="q-confidence"
                type="number"
                step="0.01"
                min={0}
                max={1}
                value={value.aiConfidence ?? ""}
                onChange={(e) =>
                  set("aiConfidence", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </div>
          </div>

          {def && def.scoringCriteria.length > 0 ? (
            <div className="grid gap-2">
              <Label>Scoring criteria weights</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {def.scoringCriteria.map((criterion) => {
                  const criteria =
                    (value.scoringConfig["criteria"] as Record<string, number> | undefined) ?? {};
                  return (
                    <div key={criterion} className="grid gap-1">
                      <Label className="text-xs capitalize" htmlFor={`crit-${criterion}`}>
                        {criterion.replace(/_/g, " ")}
                      </Label>
                      <Input
                        id={`crit-${criterion}`}
                        type="number"
                        step="0.5"
                        min={0}
                        value={criteria[criterion] ?? 1}
                        onChange={(e) =>
                          set("scoringConfig", {
                            ...value.scoringConfig,
                            criteria: { ...criteria, [criterion]: Number(e.target.value || 0) },
                          })
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Separator />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="q-topic">Topic</Label>
              <Input
                id="q-topic"
                value={value.topic}
                onChange={(e) => set("topic", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="q-tags">Tags (comma separated)</Label>
              <Input
                id="q-tags"
                value={value.tags.join(", ")}
                onChange={(e) =>
                  set(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="q-source">Source reference</Label>
            <Input
              id="q-source"
              value={value.sourceReference}
              onChange={(e) => set("sourceReference", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="q-notes">Internal admin notes</Label>
            <Textarea
              id="q-notes"
              rows={3}
              value={value.adminNotes}
              onChange={(e) => set("adminNotes", e.target.value)}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
