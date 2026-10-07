/**
 * Shapes of `GET /api/pregnancies/{id}/current-care-plan/` and the write
 * endpoints, taken from the Care Plan Integration Guide (7 Oct 2026) and the
 * backend's `plan_payload`. Ids are UUID strings; dates are ISO (`2026-10-06`)
 * and times are UTC ISO. Every text field is plain text.
 *
 * Staff receive a few extra fields (reviewer names, `clinical_review`, ...);
 * a patient does not, so they are optional here.
 */

export type CarePlanStatus = "in_progress" | "reviewed" | "finalized";
export type CarePlanLabel = "suggested_automatically" | "reviewed_by_provider";
export type SourceBasis = "web_search" | "ai_only" | "baseline";
export type SectionName = "nutrition" | "exercise";

export interface SourceLink {
  title: string;
  url: string;
  host: string;
}

/** An item the AI wrote (`source: "ai"`) or a doctor added/edited
 *  (`source: "staff"`, which then also carries an `adjustment_id`).
 *  `item_key` is only ever used to address the item, never shown. */
export interface PlanItem {
  text: string;
  item_key?: string;
  source?: "ai" | "staff";
  adjustment_id?: string;
  /** meals only: breakfast | snack | lunch | dinner */
  slot?: string;
  /** exercise activities only */
  duration_minutes?: number;
  frequency_per_week?: number;
  intensity?: "light" | "moderate";
}

export interface NutritionContent {
  meals?: PlanItem[];
  foods_to_eat?: PlanItem[];
  foods_to_avoid?: PlanItem[];
  hydration?: string;
  timing_tips?: string[];
}

export interface ExerciseContent {
  activities?: PlanItem[];
  avoid?: PlanItem[];
  stop_signs?: string[];
}

export interface ProgressBlock {
  text: string;
  /** The numbers behind `text`, for charts. Not displayed here. */
  facts?: Record<string, unknown>;
}

export interface PlanSection<C> {
  progress: ProgressBlock | null;
  label: CarePlanLabel;
  content: C;
  basis: SourceBasis;
  /** Plain source lines (for `baseline`, `sources[0]` is the one to show). */
  sources: string[];
  source_links: SourceLink[];
  generated_by_ai_notice: string | null;
  /** Always false: nobody has checked that the advice follows the pages. */
  sources_verified: boolean;
  generated_at?: string | null;
  based_on_reading_at?: string | null;
  is_fallback?: boolean;
}

export interface WeekInfo {
  week_number: number;
  week_start: string;
  week_end: string;
  replans?: number;
  last_replan_reason?: string | null;
}

export interface WeekSummary {
  week_number: number;
  week_start: string;
  week_end: string;
  trend: "improved" | "steady" | "worse" | null | Record<string, never>;
  replans?: number;
}

export interface ReadingAdvice {
  created_at: string;
  for_reading_at: string | null;
  risk_level: string;
  tips: string[];
  contact_care_team: boolean;
  contact_message: string | null;
  basis: SourceBasis;
  sources: string[];
  source_links: SourceLink[];
  generated_by_ai_notice: string | null;
  sources_verified: boolean;
  is_fallback?: boolean;
}

export interface TextEntry {
  id: string;
  text: string;
  added_by: string | null;
  created_at: string;
}

export interface ConditionFlag {
  field: string;
  label: string;
}

export interface AllergiesAndConditions {
  food_allergies: string[];
  dietary_preference: string;
  /** Only the conditions that are "yes" — the response does not say which of
   *  the others are "no" or "unknown". */
  conditions: ConditionFlag[];
}

export interface CarePlan {
  id: string;
  pregnancy_id: string;
  month_number: number;
  period_start: string;
  period_end: string;
  weeks_label: string;
  trimester: number | null;
  status: CarePlanStatus;
  is_current_month: boolean;
  message: string | null;
  week: WeekInfo | null;
  progress: ProgressBlock | null;
  reading_advice: ReadingAdvice | null;
  contact_care_team: boolean;
  contact_message: string | null;
  weeks: WeekSummary[];
  nutrition: PlanSection<NutritionContent>;
  exercise: PlanSection<ExerciseContent>;
  medications: TextEntry[];
  notes: TextEntry[];
  allergies_and_conditions: AllergiesAndConditions;
  disclaimer: string;
  warning_signs: string[];
  // Staff only:
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  finalized_by?: string | null;
  finalized_at?: string | null;
  last_evaluated_at?: string | null;
  clinical_review?: "unreviewed" | string;
}

/** The envelope of the "current plan" call. */
export interface CurrentCarePlan {
  care_plan: CarePlan | null;
  /** Readings exist but this week's plan is not written yet. */
  preparing: boolean;
  /** A plan is shown but a newer reading is still being evaluated. */
  update_pending: boolean;
  status_message: string | null;
}

export type NutritionList = "meals" | "foods_to_eat" | "foods_to_avoid";
export type ExerciseList = "activities" | "avoid";

export interface AdjustmentInput {
  section: SectionName;
  list_name: NutritionList | ExerciseList;
  action: "add" | "edit" | "remove";
  item_key?: string;
  content?: Partial<
    Pick<
      PlanItem,
      "text" | "slot" | "duration_minutes" | "frequency_per_week" | "intensity"
    >
  >;
}

/** Only the fields being changed are sent. */
export interface AllergiesInput {
  food_allergies?: string[];
  dietary_preference?: string;
  [condition: string]: string | string[] | undefined;
}

// ── Hospital care plan preferences (hospital admin only) ────────────────────

export type PreferenceStatus =
  "suggested" | "approved" | "rejected" | "inactive";

/**
 * A hospital-wide correction the system suggests when three different staff
 * members have made the same change. An approved one is passed to the AI for
 * that hospital's future plans; it is per hospital and never shared.
 *
 * `item_key` is the internal id of the item it concerns and is not shown.
 */
export interface CarePlanPreference {
  id: string;
  region: string;
  trimester: number | null;
  section: SectionName;
  item_key: string;
  status: PreferenceStatus;
  guidance: string;
  /** Suggested substitutes, when the correction replaced an item. */
  replacements: unknown[];
  /** How many different staff made the same correction. */
  supporting_staff: number | unknown[];
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}
