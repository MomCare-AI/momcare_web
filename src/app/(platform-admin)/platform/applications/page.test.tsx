import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ApplicationsPage from "./page";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/platform/applications",
  useSearchParams: () => new URLSearchParams(search),
}));

beforeEach(() => {
  replace.mockClear();
  search = "";
});
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

  it("starts from the filters in the URL", async () => {
    search = "type=ngo&status=suspended";
    renderPage();
    expect(
      await screen.findByText("MotherCare Foundation", {}, SLOW)
    ).toBeTruthy();
    expect(screen.queryByText("Noor Mother & Child Hospital")).toBeNull();
    expect(
      screen.getByRole("tab", { name: "NGOs" }).getAttribute("aria-selected")
    ).toBe("true");
  });

  it("writes the filters back to the URL as they change", async () => {
    renderPage();
    await screen.findByText("Care Foundation", {}, SLOW);

    fireEvent.click(screen.getByRole("tab", { name: "Hospitals" }));
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/platform/applications?type=hospital",
        { scroll: false }
      )
    );
  });

  it("offers to clear filters when nothing matches", async () => {
    renderPage();
    await screen.findByText("Care Foundation", {}, SLOW);
    fireEvent.change(screen.getByLabelText("Search applications"), {
      target: { value: "nothing-matches-this" },
    });
    fireEvent.click(
      await screen.findByRole("button", { name: "Clear filters" }, SLOW)
    );
    expect(await screen.findByText("Care Foundation", {}, SLOW)).toBeTruthy();
    expect(
      (screen.getByLabelText("Search applications") as HTMLInputElement).value
    ).toBe("");
  });

  it("keeps the old rows on screen while a new filter loads", async () => {
    const { container } = renderPage();
    await screen.findByText("Care Foundation", {}, SLOW);

    fireEvent.click(screen.getByRole("tab", { name: "Hospitals" }));
    // No skeleton flash: the previous rows stay (dimmed) until the new ones arrive.
    expect(container.querySelectorAll("[data-slot='skeleton']").length).toBe(0);
    expect(screen.getByText("Care Foundation")).toBeTruthy();
  });
});
