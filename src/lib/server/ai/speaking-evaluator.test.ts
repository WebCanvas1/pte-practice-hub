import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseSpeakingEvaluation } from "./speaking-evaluator.server";

const criteria = ["content", "oral_fluency", "pronunciation"];

describe("parseSpeakingEvaluation", () => {
  it("accepts a complete structured Speaking rubric", () => {
    const parsed = parseSpeakingEvaluation(
      {
        response: {
          criteria: criteria.map((name) => ({ name, score: 4, feedback: `${name} feedback` })),
          summary: "Clear response with minor hesitation.",
          strengths: ["Relevant content"],
          improvements: ["Use steadier pacing"],
          confidence: 0.78,
        },
      },
      criteria,
    );
    assert.equal(parsed.criteria.length, 3);
    assert.equal(parsed.confidence, 0.78);
  });

  it("rejects a response that omits required criteria", () => {
    assert.throws(
      () =>
        parseSpeakingEvaluation(
          {
            criteria: [{ name: "content", score: 3, feedback: "Mostly relevant" }],
            summary: "Incomplete rubric.",
            strengths: [],
            improvements: [],
            confidence: 0.4,
          },
          criteria,
        ),
      /required Speaking rubric criteria/,
    );
  });
});
