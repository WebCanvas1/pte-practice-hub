import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuestionRecord } from "@/config/questions";
import { emptyAnswer } from "@/config/test-runner";
import { scoreQuestion } from "./question-scorers";

const base = (type: string, patch: Partial<QuestionRecord> = {}): QuestionRecord => ({
  id: "q1",
  module: "reading",
  type,
  difficulty: "easy",
  title: "",
  instructions: "",
  prompt: "",
  passage: "",
  correctAnswer: "",
  alternativeAnswers: [],
  modelAnswer: "",
  explanation: "",
  scoringConfig: {},
  scoreWeight: 1,
  topic: "",
  tags: [],
  estimatedSeconds: 60,
  audio: null,
  image: null,
  sourceReference: "",
  adminNotes: "",
  aiConfidence: null,
  status: "published",
  createdBy: null,
  reviewedBy: null,
  createdAt: "",
  updatedAt: "",
  publishedAt: "",
  version: 1,
  options: [],
  content: {},
  usage: null,
  ...patch,
});
const answer = () => emptyAnswer();

describe("deterministic question scoring", () => {
  it("scores binary answers and unanswered responses", () => {
    const q = base("reading_mcq_single", {
      options: [
        { id: "a", label: "A", content: "", isCorrect: true, position: 1 },
        { id: "b", label: "B", content: "", isCorrect: false, position: 2 },
      ],
    });
    assert.equal(
      scoreQuestion(q, { text: "", data: { ...answer(), selections: ["a"] } }).earned,
      1,
    );
    assert.equal(
      scoreQuestion(q, { text: "", data: { ...answer(), selections: ["b"] } }).earned,
      0,
    );
    assert.equal(scoreQuestion(q, { text: "", data: answer() }).earned, 0);
  });

  it("applies multiple-answer partial credit and caps negative scores at zero", () => {
    const q = base("reading_mcq_multiple", {
      options: [
        { id: "a", label: "A", content: "", isCorrect: true, position: 1 },
        { id: "b", label: "B", content: "", isCorrect: false, position: 2 },
        { id: "c", label: "C", content: "", isCorrect: true, position: 3 },
      ],
    });
    assert.equal(
      scoreQuestion(q, { text: "", data: { ...answer(), selections: ["a", "c"] } }).earned,
      2,
    );
    assert.equal(
      scoreQuestion(q, { text: "", data: { ...answer(), selections: ["a", "b"] } }).earned,
      0,
    );
    assert.equal(
      scoreQuestion(q, { text: "", data: { ...answer(), selections: ["b"] } }).earned,
      0,
    );
  });

  it("normalises blank case and whitespace but keeps spelling exact", () => {
    const q = base("reading_fill_blanks", {
      content: {
        blanks: [
          { index: 1, answer: "However", choices: [] },
          { index: 2, answer: "therefore", choices: [] },
        ],
      },
    });
    const result = scoreQuestion(q, {
      text: "",
      data: { ...answer(), blanks: { "1": " however ", "2": "therefor" } },
    });
    assert.deepEqual([result.earned, result.maximum], [1, 2]);
  });

  it("uses adjacent pairs for reordered paragraphs", () => {
    const q = base("reorder_paragraphs", {
      content: {
        ordering: [
          { key: "A", content: "", correctPosition: 1 },
          { key: "B", content: "", correctPosition: 2 },
          { key: "C", content: "", correctPosition: 3 },
          { key: "D", content: "", correctPosition: 4 },
        ],
      },
    });
    assert.equal(
      scoreQuestion(q, { text: "", data: { ...answer(), ordering: ["A", "B", "D", "C"] } }).earned,
      1,
    );
  });

  it("penalises false highlights without going below zero", () => {
    const q = base("highlight_incorrect_words", {
      passage: "One wrong word here",
      content: { incorrectWords: ["wrong"] },
    });
    assert.equal(
      scoreQuestion(q, { text: "", data: { ...answer(), highlighted: [1, 2] } }).earned,
      0,
    );
  });

  it("matches dictation words despite punctuation, casing, spaces and omissions", () => {
    const q = base("write_from_dictation", { correctAnswer: "The quick, brown fox jumps." });
    assert.equal(
      scoreQuestion(q, { text: "  the QUICK brown fox jumps  ", data: answer() }).earned,
      5,
    );
    assert.equal(scoreQuestion(q, { text: "the brown fox", data: answer() }).earned, 3);
    assert.equal(
      scoreQuestion(q, { text: "extra the quick brown fox jumps words", data: answer() }).earned,
      5,
    );
  });
});
