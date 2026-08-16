import { ApiError, type ApiFieldErrors } from "@/lib/api";

const BASE = "/api/public/admin";

function csrf(): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === "pte_csrf") return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function adminApi<T>(
  action: string,
  body?: unknown,
  query?: Record<string, string>,
): Promise<T> {
  const search = new URLSearchParams(query).toString();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  const token = csrf();
  if (token) headers["x-csrf-token"] = token;
  const response = await fetch(`${BASE}/${action}${search ? `?${search}` : ""}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    fields?: ApiFieldErrors;
  };
  if (!response.ok)
    throw new ApiError(response.status, payload.error ?? "Request failed.", payload.fields);
  return payload as T;
}

export interface PlatformSettings {
  platform: {
    name: string;
    logoUrl: string;
    faviconUrl: string;
    supportEmail: string;
    contactDetails: string;
    homepageContent: string;
    currency: string;
  };
  availability: {
    tests: boolean;
    modules: Record<string, boolean>;
    difficulties: Record<string, boolean>;
    defaultTestDuration: number;
    registrationOpen: boolean;
    maintenanceMode: boolean;
  };
  legal: { terms: string; privacy: string; disclaimer: string; practiceScoreDisclaimer: string };
  emailTemplates: Record<string, { subject: string; body: string }>;
  ai: { provider: string; writingModel: string; speakingModel: string; transcriptionModel: string };
  operations: { audioRetentionDays: number; minimumQuestionPool: Record<string, number> };
  reportBranding: { title: string; logoUrl: string; footer: string };
  pricing: Array<{
    productId: string;
    name: string;
    amount: number;
    currency: string;
    active: boolean;
  }>;
}

export interface AdminStudent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  purchases: number;
  attempts: number;
  completed: number;
  lastActiveAt: string | null;
}
