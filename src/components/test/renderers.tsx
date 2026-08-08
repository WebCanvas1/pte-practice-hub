/**
 * Question renderers for the student test runner.
 *
 * One renderer per capability group; the runner picks the right one from the
 * task type's capabilities. None of these receive correct answers.
 */
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { questionTypeMap } from "@/config/questions";
import { countWords, type AnswerPayload, type RunnerQuestion } from "@/config/test-runner";
import { ArrowDown, ArrowUp } from "lucide-react";

export interface RendererProps {
  question: RunnerQuestion;
  answer: AnswerPayload;
  onChange: (patch: Partial<AnswerPayload>, immediate?: boolean) => void;
  disabled: boolean;
}

/* --------------------------------- passage --------------------------------- */

export function PassageBlock({ text }: { text: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-base leading-relaxed whitespace-pre-line">
      {text}
    </div>
  );
}

/* ------------------------------ multiple choice ---------------------------- */

function ChoiceRenderer({ question, answer, onChange, disabled }: RendererProps) {
  const single = questionTypeMap[question.typeKey]?.capabilities.options === "single";

  if (single) {
    return (
      <RadioGroup
        value={answer.selections[0] ?? ""}
        onValueChange={(value) => onChange({ selections: [value] }, true)}
        disabled={disabled}
        className="gap-3"
      >
        {question.options.map((option) => (
          <Label
            key={option.id}
            htmlFor={option.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <RadioGroupItem id={option.id} value={option.id} className="mt-1" />
            <span className="text-base leading-relaxed">
              <span className="mr-2 font-semibold">{option.label}</span>
              {option.content}
            </span>
          </Label>
        ))}
      </RadioGroup>
    );
  }

  return (
    <div className="grid gap-3">
      {question.options.map((option) => {
        const checked = answer.selections.includes(option.id);
        return (
          <Label
            key={option.id}
            htmlFor={option.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <Checkbox
              id={option.id}
              className="mt-1"
              checked={checked}
              disabled={disabled}
              onCheckedChange={(value) =>
                onChange(
                  {
                    selections: value
                      ? [...answer.selections, option.id]
                      : answer.selections.filter((id) => id !== option.id),
                  },
                  true,
                )
              }
            />
            <span className="text-base leading-relaxed">
              <span className="mr-2 font-semibold">{option.label}</span>
              {option.content}
            </span>
          </Label>
        );
      })}
    </div>
  );
}

/* ---------------------------------- blanks --------------------------------- */

/** Splits the passage on `[[n]]` markers and renders an input/dropdown inline. */
function BlanksRenderer({ question, answer, onChange, disabled }: RendererProps) {
  const parts = question.passage.split(/(\[\[\d+\]\])/g);
  const setBlank = (index: string, value: string) =>
    onChange({ blanks: { ...answer.blanks, [index]: value } }, true);

  return (
    <div className="rounded-xl border bg-card p-4 text-base leading-loose">
      {parts.map((part, i) => {
        const match = /^\[\[(\d+)\]\]$/.exec(part);
        if (!match) return <span key={i}>{part}</span>;
        const index = match[1]!;
        const blank = question.blanks.find((entry) => String(entry.index) === index);
        const choices = blank?.choices.length ? blank.choices : question.wordBank;

        if (choices.length > 0) {
          return (
            <Select
              key={i}
              value={answer.blanks[index] ?? ""}
              disabled={disabled}
              onValueChange={(value) => setBlank(index, value)}
            >
              <SelectTrigger
                className="mx-1 inline-flex h-9 w-44 align-middle"
                aria-label={`Blank ${index}`}
              >
                <SelectValue placeholder={`Blank ${index}`} />
              </SelectTrigger>
              <SelectContent>
                {choices.map((choice) => (
                  <SelectItem key={choice} value={choice}>
                    {choice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        return (
          <Input
            key={i}
            value={answer.blanks[index] ?? ""}
            disabled={disabled}
            aria-label={`Blank ${index}`}
            onChange={(event) => setBlank(index, event.target.value)}
            className="mx-1 inline-flex h-9 w-40 align-middle"
          />
        );
      })}
    </div>
  );
}

/* --------------------------------- ordering -------------------------------- */

function OrderingRenderer({ question, answer, onChange, disabled }: RendererProps) {
  const order =
    answer.ordering.length === question.orderingBlocks.length
      ? answer.ordering
      : question.orderingBlocks.map((block) => block.key);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange({ ordering: next }, true);
  };

  return (
    <ol className="grid gap-3">
      {order.map((key, index) => {
        const block = question.orderingBlocks.find((entry) => entry.key === key);
        return (
          <li key={key} className="flex items-start gap-3 rounded-xl border bg-card p-4">
            <Badge variant="secondary" className="mt-1">
              {index + 1}
            </Badge>
            <p className="flex-1 text-base leading-relaxed">{block?.content}</p>
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={disabled || index === 0}
                aria-label={`Move block ${index + 1} up`}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={disabled || index === order.length - 1}
                aria-label={`Move block ${index + 1} down`}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------ highlight words ---------------------------- */

function HighlightRenderer({ question, answer, onChange, disabled }: RendererProps) {
  const words = question.passage.split(/\s+/).filter(Boolean);
  const toggle = (index: number) =>
    onChange(
      {
        highlighted: answer.highlighted.includes(index)
          ? answer.highlighted.filter((value) => value !== index)
          : [...answer.highlighted, index],
      },
      true,
    );

  return (
    <p className="rounded-xl border bg-card p-4 text-base leading-loose">
      {words.map((word, index) => (
        <button
          key={`${word}-${index}`}
          type="button"
          disabled={disabled}
          aria-pressed={answer.highlighted.includes(index)}
          onClick={() => toggle(index)}
          className={`mr-1 rounded px-1 ${
            answer.highlighted.includes(index)
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          {word}
        </button>
      ))}
    </p>
  );
}

/* ------------------------------- written text ------------------------------ */

function WritingRenderer({ question, answer, onChange, disabled }: RendererProps) {
  const limit = question.config.wordLimit;
  const words = countWords(answer.text);
  const outside = limit ? words < limit.min || words > limit.max : false;

  return (
    <div className="grid gap-2">
      <Label htmlFor="response">Your response</Label>
      <Textarea
        id="response"
        value={answer.text}
        disabled={disabled}
        rows={10}
        className="text-base"
        placeholder="Type your response here…"
        onChange={(event) => onChange({ text: event.target.value })}
      />
      <p
        className={`text-sm ${outside ? "text-destructive" : "text-muted-foreground"}`}
        aria-live="polite"
      >
        {words} word{words === 1 ? "" : "s"}
        {limit ? ` · target ${limit.min}–${limit.max}` : ""}
      </p>
    </div>
  );
}

function ShortAnswerRenderer({ answer, onChange, disabled }: RendererProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="short-answer">Your answer</Label>
      <Input
        id="short-answer"
        value={answer.text}
        disabled={disabled}
        onChange={(event) => onChange({ text: event.target.value })}
        placeholder="Type your answer"
      />
    </div>
  );
}

/* --------------------------------- selector -------------------------------- */

export function QuestionRenderer(props: RendererProps) {
  const caps = questionTypeMap[props.question.typeKey]?.capabilities ?? {};
  if (caps.options) return <ChoiceRenderer {...props} />;
  if (caps.blanks) return <BlanksRenderer {...props} />;
  if (caps.ordering) return <OrderingRenderer {...props} />;
  if (caps.highlightWords) return <HighlightRenderer {...props} />;
  if (caps.writtenResponse) return <WritingRenderer {...props} />;
  if (caps.shortAnswer && !caps.spokenResponse) return <ShortAnswerRenderer {...props} />;
  return null;
}
