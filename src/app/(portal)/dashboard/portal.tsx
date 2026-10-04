"use client";

import { createContext, useContext } from "react";

import type {
  CurrentUser,
  OrgSummary,
} from "@/features/portal/hooks/usePortalData";

/**
 * What every dashboard page can read about the signed-in user and hospital.
 * Lives in its own module because a Next.js layout file may export nothing
 * but the layout itself; pages and tests import from here.
 */

// Re-exported for pages; the shapes live with the queries that fetch them.
export type { CurrentUser, OrgSummary };

export interface PortalValue {
  org: OrgSummary;
  user: CurrentUser;
  isHospitalAdmin: boolean;
  /** May make a clinical judgement — acknowledge an alert, review an
   *  assessment. Mirrors the server's IsClinician, which is what actually
   *  enforces it; this only decides what is worth putting on screen. */
  isClinician: boolean;
  refresh: () => Promise<void>;
}

/**
 * How a role reads on the sidebar's own identity card. "Dr." is a role
 * convention shown for every provider, not a stored title on any one
 * person's record — provider is this system's doctor role (see
 * core/common/permissions.py's IsClinician), so the prefix is derived,
 * never a per-user hardcode.
 */
const ROLE_LABELS: Record<string, string> = {
  hospital_admin: "Hospital Administrator",
  provider: "Doctor",
  nurse: "Nurse",
  care_manager: "Care Manager",
  platform_admin: "Platform Administrator",
  patient: "Patient",
};

// Exported for tests only — not part of this module's real public surface,
// since nothing outside the sidebar itself has a reason to format identity.
export function displayNameFor(user: CurrentUser): string {
  const name = `${user.first_name} ${user.last_name}`.trim() || user.email;
  return user.role_code === "provider" ? `Dr. ${name}` : name;
}

export function roleLabelFor(roleCode: string): string {
  return ROLE_LABELS[roleCode] ?? roleCode.replace(/_/g, " ");
}

export const PortalContext = createContext<PortalValue | null>(null);

/** Portal data, fetched once by the shell rather than by every page. */
export function usePortal(): PortalValue {
  const ctx = useContext(PortalContext);
  if (!ctx)
    throw new Error("usePortal must be used inside the dashboard layout");
  return ctx;
}
