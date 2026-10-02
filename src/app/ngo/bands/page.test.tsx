import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NgoBandsPage from "./page";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NgoBandsPage />
    </QueryClientProvider>
  );
}

describe("NGO bands page loading state", () => {
  it("shows skeleton rows while loading, then the real bands", async () => {
    const { container } = renderPage();

    // Loading: placeholders, no plain "Loading…" text, no real data yet.
    expect(
      container.querySelectorAll("[data-slot='skeleton']").length
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Loading…")).toBeNull();
    expect(screen.queryByText("MCB-0001")).toBeNull();

    // Loaded: real rows replace every placeholder.
    expect(await screen.findByText("MCB-0001")).toBeTruthy();
    expect(container.querySelectorAll("[data-slot='skeleton']").length).toBe(0);
  });
});
