import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseWritingEvaluation } from "./writing-evaluator.server";

const criteria = ["content", "form", "grammar", "vocabulary"];

describe("parseWritingEvaluation", () => {
  it("accepts a Workers AI structured response", () => {
    const parsed = parseWritingEvaluation(
      {
        response: {
          criteria: criteria.map((name) => ({ name, score: 4, feedback: `${name} feedback` })),
          summary: "Clear and relevant summary.",
          strengths: ["Clear main idea"],
          improvements: ["Use more precise vocabulary"],
          confidence: 0.85,
        },
      },
      criteria,
    );
    assert.equal(parsed.criteria.length, 4);
    assert.equal(parsed.confidence, 0.85);
  });

  it("rejects missing rubric criteria", () => {
    assert.throws(
      () =>
        parseWritingEvaluation(
          {
            criteria: [{ name: "content", score: 4, feedback: "Relevant" }],
            summary: "Incomplete rubric.",
            strengths: [],
            improvements: [],
            confidence: 0.5,
          },
          criteria,
        ),
      /required rubric criteria/,
    );
  });
});
