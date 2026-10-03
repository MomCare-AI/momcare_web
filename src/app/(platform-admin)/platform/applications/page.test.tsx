import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ApplicationsPage from "./page";

afterEach(cleanup);

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ApplicationsPage />
    </QueryClientProvider>
  );
}

const SLOW = { timeout: 3000 };

describe("applications inbox", () => {
  it("shows skeletons first, then hospitals and NGOs together", async () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll("[data-slot='skeleton']").length
    ).toBeGreaterThan(0);

    expect(
      await screen.findByText("Noor Mother & Child Hospital", {}, SLOW)
    ).toBeTruthy();
    expect(screen.getByText("Care Foundation")).toBeTruthy();
  });

  it("filters by type tab, status chip and search", async () => {
    renderPage();
    await screen.findByText("Care Foundation", {}, SLOW);

    fireEvent.click(screen.getByRole("tab", { name: "NGOs" }));
    await waitFor(() =>
      expect(screen.queryByText("Noor Mother & Child Hospital")).toBeNull()
    );
    expect(await screen.findByText("Care Foundation", {}, SLOW)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Suspended" }));
    expect(
      await screen.findByText("MotherCare Foundation", {}, SLOW)
    ).toBeTruthy();
    await waitFor(() =>
      expect(screen.queryByText("Care Foundation")).toBeNull()
    );

    fireEvent.click(screen.getByRole("tab", { name: "All" }));
    fireEvent.click(screen.getByRole("button", { name: "Any status" }));
    fireEvent.change(screen.getByLabelText("Search applications"), {
      target: { value: "nothing-matches-this" },
    });
    expect(
      await screen.findByText("No applications match", {}, SLOW)
    ).toBeTruthy();
  });

  it("links each row to its review page", async () => {
    renderPage();
    const row = await screen.findByText(
      "Noor Mother & Child Hospital",
      {},
      SLOW
    );
    expect(row.closest("a")?.getAttribute("href")).toBe(
      "/platform/applications/hospital/h1"
    );
  });
});
