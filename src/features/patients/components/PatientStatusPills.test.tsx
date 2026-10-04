import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PatientStatusPills } from "./PatientStatusPills";

afterEach(cleanup);

const s = (name: string, description = "", color = "#2f8a72") => ({
  name,
  description,
  color,
});

describe("PatientStatusPills", () => {
  it("shows nothing for a patient with no statuses", () => {
    const { container } = render(<PatientStatusPills statuses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows each status once, coloured, with its description as a tooltip", () => {
    render(
      <PatientStatusPills
        statuses={[s("Stable", "Doing well"), s("stable"), s("Follow up")]}
      />
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual(["Stable", "Follow up"]);
    expect(items[0].getAttribute("title")).toBe("Doing well");
    // Colour is applied to text and a tinted background.
    expect(items[0].style.color).toBe("rgb(47, 138, 114)");
  });

  it("collapses the rest into +N, naming them on hover, past the limit", () => {
    render(
      <PatientStatusPills max={2} statuses={[s("A"), s("B"), s("C"), s("D")]} />
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual(["A", "B", "+2"]);
    expect(items[2].getAttribute("title")).toBe("C, D");
  });

  it("does not break on a malformed colour", () => {
    render(<PatientStatusPills statuses={[s("Odd", "", "not-a-colour")]} />);
    expect(screen.getByText("Odd").style.color).toBe("rgb(67, 97, 238)");
  });

  it("stack layout shows them all in a column, however many", () => {
    render(
      <PatientStatusPills
        layout="stack"
        statuses={[s("A"), s("B"), s("C"), s("D"), s("E")]}
      />
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual(["A", "B", "C", "D", "E"]);
    expect(screen.getByRole("list").style.flexDirection).toBe("column");
  });

  it("stack layout can still be limited when a caller asks", () => {
    render(
      <PatientStatusPills layout="stack" max={1} statuses={[s("A"), s("B")]} />
    );
    expect(screen.getAllByRole("listitem").map((i) => i.textContent)).toEqual([
      "A",
      "+1",
    ]);
  });
});
