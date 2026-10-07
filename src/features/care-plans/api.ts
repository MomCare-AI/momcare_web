import { authFetch } from "@/core/api/authFetch";
import { apiErrorMessage } from "@/features/monitoring/api";
import type { Paginated } from "@/features/patients/types";
import type {
  AdjustmentInput,
  AllergiesInput,
  CarePlan,
  CarePlanPreference,
  CurrentCarePlan,
  PreferenceStatus,
} from "./types";

/** A failed Care Plan call, keeping the HTTP status so the screen can tell
 *  "this plan is finalized" (409) from "you may not do that" (403). */
export class CarePlanError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "CarePlanError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  fallback = "Could not complete this request."
): Promise<T> {
  const res = await authFetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new CarePlanError(apiErrorMessage(body, fallback), res.status);
  }
  return body as T;
}

const json = (body: unknown) => JSON.stringify(body);

/** `GET /api/pregnancies/{id}/current-care-plan/` — the plan for the week she
 *  is in, or `care_plan: null` when she has no readings yet. */
export function getCurrentCarePlan(pregnancyId: string) {
  return request<CurrentCarePlan>(
    `/api/pregnancies/${pregnancyId}/current-care-plan/`,
    {},
    "Could not load the care plan."
  );
}

// Every write below returns the whole updated plan.
const plan = (id: string, tail: string) => `/api/care-plans/${id}/${tail}`;

export const addAdjustment = (planId: string, input: AdjustmentInput) =>
  request<CarePlan>(plan(planId, "adjustments/"), {
    method: "POST",
    body: json(input),
  });

export const updateAdjustment = (
  planId: string,
  adjustmentId: string,
  content: NonNullable<AdjustmentInput["content"]>
) =>
  request<CarePlan>(plan(planId, `adjustments/${adjustmentId}/`), {
    method: "PATCH",
    body: json({ content }),
  });

export const deleteAdjustment = (planId: string, adjustmentId: string) =>
  request<CarePlan>(plan(planId, `adjustments/${adjustmentId}/`), {
    method: "DELETE",
    body: json({}),
  });

export const addMedication = (planId: string, text: string) =>
  request<CarePlan>(plan(planId, "medications/"), {
    method: "POST",
    body: json({ text }),
  });

export const updateMedication = (planId: string, id: string, text: string) =>
  request<CarePlan>(plan(planId, `medications/${id}/`), {
    method: "PATCH",
    body: json({ text }),
  });

export const deleteMedication = (planId: string, id: string) =>
  request<CarePlan>(plan(planId, `medications/${id}/`), {
    method: "DELETE",
    body: json({}),
  });

export const addNote = (planId: string, text: string) =>
  request<CarePlan>(plan(planId, "notes/"), {
    method: "POST",
    body: json({ text }),
  });

export const updateNote = (planId: string, id: string, text: string) =>
  request<CarePlan>(plan(planId, `notes/${id}/`), {
    method: "PATCH",
    body: json({ text }),
  });

export const deleteNote = (planId: string, id: string) =>
  request<CarePlan>(plan(planId, `notes/${id}/`), { method: "DELETE" });

export const updateAllergies = (planId: string, input: AllergiesInput) =>
  request<CarePlan>(plan(planId, "allergies-conditions/"), {
    method: "PATCH",
    body: json(input),
  });

export const reviewPlan = (planId: string) =>
  request<CarePlan>(plan(planId, "review/"), { method: "POST" });

export const finalizePlan = (planId: string) =>
  request<CarePlan>(plan(planId, "finalize/"), { method: "POST" });

export const reopenPlan = (planId: string) =>
  request<CarePlan>(plan(planId, "reopen/"), { method: "POST" });

// ── Hospital care plan preferences (hospital admin only) ────────────────────

const prefs = (tail = "") => `/api/care-plan-preferences/${tail}`;

/** The admin's inbox. `page_size=100` (the server's own cap) — a hospital has
 *  few of these, and the tab says so if there are ever more. */
export function listPreferences(status: PreferenceStatus) {
  return request<Paginated<CarePlanPreference>>(
    `${prefs()}?status=${status}&page_size=100`,
    {},
    "Could not load the care plan preferences."
  );
}

export const getPreference = (id: string) =>
  request<CarePlanPreference>(
    prefs(`${id}/`),
    {},
    "Could not load this preference."
  );

export const updatePreferenceGuidance = (id: string, guidance: string) =>
  request<CarePlanPreference>(prefs(`${id}/`), {
    method: "PATCH",
    body: JSON.stringify({ guidance }),
  });

/** `guidance` is optional: send it to approve with reworded guidance. */
export const approvePreference = (id: string, guidance?: string) =>
  request<CarePlanPreference>(prefs(`${id}/approve/`), {
    method: "POST",
    body: JSON.stringify(guidance ? { guidance } : {}),
  });

export const rejectPreference = (id: string) =>
  request<CarePlanPreference>(prefs(`${id}/reject/`), { method: "POST" });

export const deactivatePreference = (id: string) =>
  request<CarePlanPreference>(prefs(`${id}/deactivate/`), { method: "POST" });
