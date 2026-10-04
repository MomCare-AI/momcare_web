import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PatientsTableSkeleton } from "./PatientsTableSkeleton";

afterEach(cleanup);

describe("PatientsTableSkeleton", () => {
  it("announces loading, and mirrors the list's toolbar and rows", () => {
    const { container } = render(<PatientsTableSkeleton rows={4} />);

    expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Loading patients…")).toBeTruthy();
    // Toolbar (search + filters button) and one row per requested row.
    expect(container.querySelector(".mc-table-toolbar")).toBeTruthy();
    expect(container.querySelectorAll(".mc-rows .mc-row")).toHaveLength(4);
    // Purely visual: hidden from assistive tech apart from the status text.
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
  });
});
