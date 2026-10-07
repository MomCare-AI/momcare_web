import { describe, expect, it } from "vitest";

import {
  carePlanPermissions,
  isEditable,
  labelText,
  safeSourceLinks,
  weekRangeLabel,
} from "./carePlanLogic";
import {
  carePlanRefetchInterval,
  CARE_PLAN_POLL_MS,
} from "./hooks/useCarePlan";
import type { CurrentCarePlan } from "./types";

const envelope = (over: Partial<CurrentCarePlan>): CurrentCarePlan => ({
  care_plan: null,
  preparing: false,
  update_pending: false,
  status_message: null,
  ...over,
});
const poll = (data: CurrentCarePlan | undefined) =>
  carePlanRefetchInterval({ state: { data } } as never);

describe("care plan polling", () => {
  it("polls every few seconds while preparing or update pending", () => {
    expect(poll(envelope({ preparing: true }))).toBe(CARE_PLAN_POLL_MS);
    expect(poll(envelope({ update_pending: true }))).toBe(CARE_PLAN_POLL_MS);
    expect(CARE_PLAN_POLL_MS).toBeGreaterThanOrEqual(3000);
    expect(CARE_PLAN_POLL_MS).toBeLessThanOrEqual(5000);
  });

  it("stops by itself once both flags clear, and before any data", () => {
    expect(poll(envelope({}))).toBe(false);
    expect(poll(undefined)).toBe(false);
  });
});

describe("care plan permissions", () => {
  it("only a provider writes medications", () => {
    expect(carePlanPermissions("provider").canWriteMedications).toBe(true);
    for (const role of ["nurse", "care_manager", "hospital_admin"]) {
      expect(carePlanPermissions(role).canWriteMedications).toBe(false);
    }
  });

  it("a provider or the hospital admin finalizes and reopens", () => {
    expect(carePlanPermissions("provider").canFinalize).toBe(true);
    expect(carePlanPermissions("hospital_admin").canFinalize).toBe(true);
    expect(carePlanPermissions("nurse").canFinalize).toBe(false);
    expect(carePlanPermissions("care_manager").canFinalize).toBe(false);
  });

  it("a finalized plan cannot be edited", () => {
    expect(isEditable({ status: "finalized" })).toBe(false);
    expect(isEditable({ status: "reviewed" })).toBe(true);
    expect(isEditable({ status: "in_progress" })).toBe(true);
  });
});

describe("care plan wording and links", () => {
  it("uses the guide's exact labels", () => {
    expect(labelText("suggested_automatically")).toBe(
      "Suggested automatically"
    );
    expect(labelText("reviewed_by_provider")).toBe("Reviewed by your provider");
  });

  it("formats a week from its own dates, without a timezone shift", () => {
    expect(weekRangeLabel("2026-10-06", "2026-10-12")).toBe("6-12 Oct");
    expect(weekRangeLabel("2026-09-30", "2026-10-06")).toBe("30 Sep - 6 Oct");
  });

  it("drops source links that are not web addresses", () => {
    const links = safeSourceLinks([
      { title: "WHO", url: "https://who.int/x", host: "who.int" },
      { title: "bad", url: "javascript:alert(1)", host: "x" },
      { title: "also bad", url: "not a url", host: "y" },
    ]);
    expect(links.map((l) => l.title)).toEqual(["WHO"]);
  });
});
