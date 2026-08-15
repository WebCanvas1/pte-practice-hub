import type { QuestionRecord } from "@/config/questions";
import type { ScoringAnswer, ScoringMethod } from "./types";

const AI_TYPES = new Set([
  "read_aloud",
  "repeat_sentence",
  "describe_image",
  "retell_lecture",
  "answer_short_question",
  "respond_to_situation",
  "summarize_group_discussion",
  "summarize_written_text",
  "write_essay",
  "summarize_spoken_text",
]);
const BINARY_TYPES = new Set([
  "reading_mcq_single",
  "listening_mcq_single",
  "highlight_correct_summary",
  "select_missing_word",
]);
const MULTIPLE_TYPES = new Set(["reading_mcq_multiple", "listening_mcq_multiple"]);
const BLANK_TYPES = new Set([
  "reading_fill_blanks",
  "reading_writing_fill_blanks",
  "listening_fill_blanks",
]);

export function methodForType(typeKey: string): ScoringMethod {
  if (BINARY_TYPES.has(typeKey)) return "binary";
  if (MULTIPLE_TYPES.has(typeKey)) return "multiple-choice-negative";
  if (BLANK_TYPES.has(typeKey)) return "blank-per-answer";
  if (typeKey === "reorder_paragraphs") return "adjacent-pairs";
  if (typeKey === "highlight_incorrect_words") return "highlight-negative";
  if (typeKey === "write_from_dictation") return "word-match";
  return AI_TYPES.has(typeKey) ? "ai" : "ai";
}

const clean = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
const words = (value: string) =>
  clean(value)
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .split(" ")
    .filter(Boolean);

function optionId(question: QuestionRecord, index: number): string {
  return question.options[index]?.id ?? `opt_${index + 1}`;
}

export interface RawScore {
  method: ScoringMethod;
  status: "scored" | "pending_ai";
  earned: number;
  maximum: number;
  correctAnswer: unknown;
  breakdown: Record<string, unknown>;
}

export function scoreQuestion(question: QuestionRecord, answer: ScoringAnswer): RawScore {
  const method = methodForType(question.type);
  if (method === "ai") {
    return {
      method,
      status: "pending_ai",
      earned: 0,
      maximum: 0,
      correctAnswer: null,
      breakdown: {},
    };
  }

  if (method === "binary" || method === "multiple-choice-negative") {
    const correct = question.options
      .map((option, index) => ({ option, id: optionId(question, index) }))
      .filter(({ option }) => option.isCorrect)
      .map(({ id }) => id);
    const selected = [...new Set(answer.data.selections)];
    const hits = selected.filter((id) => correct.includes(id)).length;
    const falsePositives = selected.filter((id) => !correct.includes(id)).length;
    const negative = (question.scoringConfig["negativeMarking"] as boolean | undefined) ?? true;
    const earned =
      method === "binary"
        ? Number(selected.length === 1 && hits === 1)
        : Math.max(0, hits - (negative ? falsePositives : 0));
    return {
      method,
      status: "scored",
      earned,
      maximum: Math.max(correct.length, 1),
      correctAnswer: { selectedOptionIds: correct },
      breakdown: {
        correctSelections: hits,
        incorrectSelections: falsePositives,
        negativeMarking: negative,
      },
    };
  }

  if (method === "blank-per-answer") {
    const expected = question.content.blanks ?? [];
    let earned = 0;
    for (const blank of expected) {
      if (clean(answer.data.blanks[String(blank.index)] ?? "") === clean(blank.answer)) earned += 1;
    }
    return {
      method,
      status: "scored",
      earned,
      maximum: expected.length,
      correctAnswer: {
        blankAnswers: Object.fromEntries(expected.map((b) => [String(b.index), b.answer])),
      },
      breakdown: { correctBlanks: earned, totalBlanks: expected.length },
    };
  }

  if (method === "adjacent-pairs") {
    const expected = [...(question.content.ordering ?? [])]
      .sort((a, b) => a.correctPosition - b.correctPosition)
      .map((block) => block.key);
    const actual = answer.data.ordering;
    let earned = 0;
    for (let i = 0; i < actual.length - 1; i += 1) {
      const position = expected.indexOf(actual[i]!);
      if (position >= 0 && expected[position + 1] === actual[i + 1]) earned += 1;
    }
    return {
      method,
      status: "scored",
      earned,
      maximum: Math.max(0, expected.length - 1),
      correctAnswer: { ordering: expected },
      breakdown: { correctAdjacentPairs: earned },
    };
  }

  if (method === "highlight-negative") {
    const targetWords = (question.content.incorrectWords ?? []).map(clean);
    const passageWords = question.passage
      .split(/\s+/)
      .map((word) => clean(word.replace(/[^\p{L}\p{N}'-]/gu, "")));
    const targetIndices = new Set<number>();
    targetWords.forEach((target) =>
      passageWords.forEach((word, index) => word === target && targetIndices.add(index)),
    );
    const selected = new Set(answer.data.highlighted);
    const hits = [...selected].filter((index) => targetIndices.has(index)).length;
    const falsePositives = [...selected].filter((index) => !targetIndices.has(index)).length;
    return {
      method,
      status: "scored",
      earned: Math.max(0, hits - falsePositives),
      maximum: targetIndices.size || targetWords.length,
      correctAnswer: { highlightedIndices: [...targetIndices] },
      breakdown: { correctSelections: hits, incorrectSelections: falsePositives },
    };
  }

  const expected = words(question.correctAnswer || question.audio?.transcript || "");
  const actual = words(answer.text);
  const matrix = Array.from(
    { length: expected.length + 1 },
    () => Array(actual.length + 1).fill(0) as number[],
  );
  for (let i = 1; i <= expected.length; i += 1) {
    for (let j = 1; j <= actual.length; j += 1) {
      matrix[i]![j] =
        expected[i - 1] === actual[j - 1]
          ? matrix[i - 1]![j - 1]! + 1
          : Math.max(matrix[i - 1]![j]!, matrix[i]![j - 1]!);
    }
  }
  const earned = matrix[expected.length]![actual.length]!;
  return {
    method,
    status: "scored",
    earned,
    maximum: expected.length,
    correctAnswer: { transcript: question.correctAnswer || question.audio?.transcript || "" },
    breakdown: {
      correctWords: earned,
      expectedWordCount: expected.length,
      submittedWordCount: actual.length,
    },
  };
}
