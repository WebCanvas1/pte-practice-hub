import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

import type { WorkerEnv } from "../lib/server/bindings.server";
import { processJob } from "../lib/server/content-import.server";

type Params = { jobId: string };

export class ContentImportWorkflow extends WorkflowEntrypoint<WorkerEnv, Params> {
  override async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    if (!this.env.DB) throw new Error("D1 binding DB is required for import processing.");
    await step.do(
      "extract, classify and prepare questions",
      { retries: { limit: 3, delay: "15 seconds", backoff: "exponential" }, timeout: "10 minutes" },
      () => processJob(this.env, this.env.DB!, event.payload.jobId),
    );
    return { jobId: event.payload.jobId, status: "complete" };
  }
}
