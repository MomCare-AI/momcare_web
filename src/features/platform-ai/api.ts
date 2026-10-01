import { authFetch, authJson } from "@/core/api/authFetch";
import type {
  AIProviderConfig,
  AISummaryTemplate,
  AISummaryTemplateListResponse,
  TemplateReviewResult,
} from "./types";

const BASE = "/api/platform-admin/ai-config/summary-templates/";

function firstError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  // The create endpoint's own coverage check 400s with `missing_labels`
  // alongside the generic `content` field error — surface the readable
  // list rather than the raw field-error array when it's present.
  if (
    Array.isArray(record.missing_labels) &&
    record.missing_labels.length > 0
  ) {
    return `Add the remaining details to your template: ${record.missing_labels.join("; ")}.`;
  }
  if (typeof record.detail === "string") return record.detail;
  for (const value of Object.values(record)) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return null;
}

export function listSummaryTemplates(page = 1) {
  const query = page > 1 ? `?page=${page}` : "";
  return authJson<AISummaryTemplateListResponse>(`${BASE}${query}`);
}

export function getAIProviderConfig() {
  return authJson<AIProviderConfig>("/api/platform-admin/ai-config/");
}

/** Creating a template activates it immediately and deactivates whichever
 *  one was active before — see `AISummaryTemplate`'s own docstring. There
 *  is no PATCH; a change is always a new row. */
export async function createSummaryTemplate(input: {
  name: string;
  content: string;
}): Promise<AISummaryTemplate> {
  const res = await authFetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not save this template.");
  }
  return body as AISummaryTemplate;
}

export async function activateSummaryTemplate(
  templateId: string
): Promise<AISummaryTemplate> {
  const res = await authFetch(`${BASE}${templateId}/activate/`, {
    method: "POST",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not activate this template.");
  }
  return body as AISummaryTemplate;
}

/** The review/"enhance" step — stateless, nothing is saved. See
 *  `TemplateReviewResult`'s own docstring for the two possible shapes. */
export async function reviewSummaryTemplate(
  content: string
): Promise<TemplateReviewResult> {
  const res = await authFetch(`${BASE}enhance/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not review this template.");
  }
  return body as TemplateReviewResult;
}
