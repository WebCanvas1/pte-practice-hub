import assert from "node:assert/strict";
import test from "node:test";
import {
  extractImportCandidates,
  importTextSimilarity,
  normalizeImportText,
} from "./content-extraction.ts";
const bytes = (value: string) => new TextEncoder().encode(value).buffer;
test("extracts TXT blocks", () => {
  assert.equal(
    extractImportCandidates("sample.txt", bytes("First valid question?\n\nSecond valid question?"))
      .length,
    2,
  );
});
test("extracts CSV questions, options and answers", () => {
  const rows = extractImportCandidates(
    "sample.csv",
    bytes("prompt,option_a,option_b,answer\nCapital of France?,Paris,London,Paris"),
  );
  assert.equal(rows[0]?.answer, "Paris");
  assert.deepEqual(rows[0]?.options, ["Paris", "London"]);
});
test("extracts text-showing PDF operators", () => {
  const rows = extractImportCandidates(
    "sample.pdf",
    bytes("%PDF-1.4\nBT (This is a sufficiently long PDF question?) Tj ET"),
  );
  assert.match(rows[0]?.prompt ?? "", /PDF question/);
});
test("flags provider-dependent and failed PDF extraction", () => {
  assert.match(extractImportCandidates("audio.mp3", bytes("x"))[0]?.warnings[0] ?? "", /provider/);
  assert.equal(extractImportCandidates("scan.pdf", bytes("%PDF")).length, 0);
});
test("normalises and detects duplicate text", () => {
  const a = normalizeImportText("What is AI?");
  assert.equal(a, "what is ai");
  assert.equal(importTextSimilarity(a, a), 1);
  assert.ok(importTextSimilarity(a, "what is artificial intelligence") < 1);
});
