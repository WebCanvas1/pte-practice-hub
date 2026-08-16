import { ApiError } from "./api";
function csrf() {
  return document.cookie
    .split(";")
    .map((p) => p.trim().split("="))
    .find(([k]) => k === "pte_csrf")?.[1];
}
export async function importApi<T>(action: string, body?: unknown) {
  const form = body instanceof FormData;
  const response = await fetch(`/api/public/content-imports/${action}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: {
      ...(body !== undefined && !form ? { "content-type": "application/json" } : {}),
      ...(csrf() ? { "x-csrf-token": decodeURIComponent(csrf()!) } : {}),
    },
    ...(body === undefined ? {} : { body: form ? body : JSON.stringify(body) }),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new ApiError(response.status, payload.error ?? "Import request failed.");
  return payload;
}
export interface ImportJob {
  id: string;
  status: string;
  total_files: number;
  total_questions: number;
  progress: number;
  created_at: string;
}
export interface ImportedQuestion {
  id: string;
  upload_id: string;
  file_name: string;
  source_location: string;
  prompt: string;
  module_key: string;
  type_key: string;
  difficulty: string;
  correct_answer: string | null;
  model_answer: string | null;
  explanation: string | null;
  tags_json: string;
  confidence: number;
  confidence_level: string;
  warnings_json: string;
  review_status: string;
  selected: number;
  duplicate_score: number | null;
}
