import { authFetch, authJson } from "@/core/api/authFetch";
import type {
  AISummaryTemplate,
  AISummaryTemplateListResponse,
  TemplateEnhanceResult,
  TemplateSection,
} from "./types";

function firstError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  for (const value of Object.values(record)) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return null;
}

const BASE = "/api/organization/me/summary-templates/";

export function listSummaryTemplates() {
  return authJson<AISummaryTemplateListResponse>(BASE);
}

export async function createSummaryTemplate(input: {
  name: string;
  sections: TemplateSection[];
  extra_instructions: string;
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

export async function deactivateSummaryTemplate(
  templateId: string
): Promise<AISummaryTemplate> {
  const res = await authFetch(`${BASE}${templateId}/deactivate/`, {
    method: "POST",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(firstError(body) ?? "Could not deactivate this template.");
  }
  return body as AISummaryTemplate;
}

export async function enhanceSummaryTemplateWording(input: {
  sections: TemplateSection[];
  extra_instructions: string;
}): Promise<TemplateEnhanceResult> {
  const res = await authFetch(`${BASE}enhance/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      firstError(body) ?? "Could not enhance this template's wording."
    );
  }
  return body as TemplateEnhanceResult;
}
