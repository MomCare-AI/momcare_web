import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { RiskHistoryEditor } from "./RiskHistoryEditor";
import { RISK_FACTORS, type Pregnancy } from "../types";

const mutate = vi.fn();
vi.mock("../hooks/usePatients", () => ({
  useUpdatePregnancy: () => ({
    mutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

function makePregnancy(overrides: Partial<Pregnancy> = {}): Pregnancy {
  const answers = Object.fromEntries(
    RISK_FACTORS.map(({ field }) => [field, "unknown"])
  );
  return {
    id: "preg1",
    updated_at: "t0",
    ...answers,
    ...overrides,
  } as Pregnancy;
}

function group(label: string) {
  return screen.getByRole("group", { name: label });
}

afterEach(cleanup);

describe("RiskHistoryEditor", () => {
  beforeEach(() => mutate.mockClear());

  it("shows unanswered factors as Unknown, never No", () => {
    render(
      <RiskHistoryEditor patientId="p1" pregnancy={makePregnancy()} canWrite />
    );
    for (const { label } of RISK_FACTORS) {
      const unknown = group(label).querySelector('[aria-pressed="true"]');
      expect(unknown?.textContent).toBe("Unknown");
    }
    expect(screen.getByText("7 not answered")).toBeTruthy();
  });

  it("keeps Save disabled until an answer changes, then sends all seven", () => {
    render(
      <RiskHistoryEditor patientId="p1" pregnancy={makePregnancy()} canWrite />
    );
    const save = screen.getByRole("button", {
      name: "Save obstetric history",
    }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fireEvent.click(
      group("Diabetes").querySelectorAll("button")[0] as HTMLButtonElement
    );
    expect(save.disabled).toBe(false);
    fireEvent.click(save);

    const sent = mutate.mock.calls[0][0];
    expect(sent.diabetes).toBe("yes");
    expect(Object.keys(sent)).toHaveLength(RISK_FACTORS.length);
  });

  it("renders no Save button and disables the answers without write access", () => {
    render(
      <RiskHistoryEditor
        patientId="p1"
        pregnancy={makePregnancy()}
        canWrite={false}
      />
    );
    expect(screen.queryByRole("button", { name: /Save/ })).toBeNull();
    const first = group("Diabetes").querySelector(
      "button"
    ) as HTMLButtonElement;
    expect(first.disabled).toBe(true);
  });
});
