import type { CarePlan, CarePlanLabel, SourceLink } from "./types";

/** Exactly the wording the guide prescribes for the label. */
export function labelText(label: CarePlanLabel): string {
  return label === "reviewed_by_provider"
    ? "Reviewed by your provider"
    : "Suggested automatically";
}

export const STATUS_TEXT = {
  in_progress: "In progress",
  reviewed: "Reviewed",
  finalized: "Finalized",
} as const;

/** Who may do what. The server enforces all of it (403); this only decides
 *  which controls are worth showing. */
export function carePlanPermissions(roleCode: string) {
  const isProvider = roleCode === "provider";
  const isAdmin = roleCode === "hospital_admin";
  return {
    /** Only a provider writes medications. */
    canWriteMedications: isProvider,
    /** Finalize and reopen: a provider or the hospital admin. */
    canFinalize: isProvider || isAdmin,
  };
}

/** A finalized plan cannot be edited (the server answers 409). */
export function isEditable(plan: Pick<CarePlan, "status">): boolean {
  return plan.status !== "finalized";
}

/** Parses `2026-10-06` as that calendar day, not as midnight UTC (which would
 *  show the previous day west of Greenwich). Week dates are the hospital's, so
 *  they are used exactly as given. */
function dayOf(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** "6-12 Oct", or "30 Sep - 6 Oct" across a month. */
export function weekRangeLabel(startIso: string, endIso: string): string {
  const start = dayOf(startIso);
  const end = dayOf(endIso);
  if (!start || !end) return "";
  const month = (d: Date) => d.toLocaleString("en", { month: "short" });
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()}-${end.getDate()} ${month(end)}`
    : `${start.getDate()} ${month(start)} - ${end.getDate()} ${month(end)}`;
}

/** Only real web links are ever turned into anchors; anything else (a
 *  `javascript:` address, say) is dropped rather than rendered. */
export function safeSourceLinks(links: SourceLink[]): SourceLink[] {
  return links.filter((l) => {
    try {
      const protocol = new URL(l.url).protocol;
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  });
}

export const TREND_TEXT: Record<string, string> = {
  improved: "improved",
  steady: "steady",
  worse: "worse",
};

export const DIETARY_OPTIONS = [
  { value: "none", label: "No preference" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "other", label: "Other" },
];

export const CONDITION_FIELDS: { field: string; label: string }[] = [
  { field: "previous_c_section", label: "Previous C-section" },
  { field: "previous_preeclampsia", label: "Previous pre-eclampsia" },
  {
    field: "previous_gestational_diabetes",
    label: "Previous gestational diabetes",
  },
  { field: "previous_preterm_birth", label: "Previous preterm birth" },
  { field: "chronic_hypertension", label: "Chronic hypertension" },
  { field: "diabetes", label: "Diabetes" },
  { field: "multiple_pregnancy", label: "Multiple pregnancy" },
];
