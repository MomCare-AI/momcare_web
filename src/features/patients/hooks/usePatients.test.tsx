import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePatientList } from "./usePatients";

const listPatients = vi.fn();
vi.mock("../api", () => ({
  listPatients: (args: { workflow?: string }) => listPatients(args),
}));

const page = (names: string[]) => ({
  count: names.length,
  page: 1,
  page_size: 100,
  total_pages: 1,
  next: null,
  previous: null,
  results: names.map((n) => ({ id: n, name: n })),
});

/** Resolve each call only when the test says so, to observe the loading gap. */
function deferred() {
  const calls: Record<string, (v: unknown) => void> = {};
  listPatients.mockImplementation(
    (args: { workflow?: string }) =>
      new Promise((resolve) => {
        calls[args.workflow ?? "all"] = resolve;
      })
  );
  return calls;
}

function setup(keepPreviousData: boolean) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(
    ({ workflow }: { workflow?: "risk_review" | "low_confidence" }) =>
      usePatientList("", 1, false, 100, workflow, undefined, {
        keepPreviousData,
      }),
    {
      initialProps: {},
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    }
  );
}

describe("usePatientList when the filter changes", () => {
  it("shows no rows (so the page can show its skeleton) while a different list loads", async () => {
    const calls = deferred();
    const { result, rerender } = setup(false);

    await act(async () => calls["all"](page(["Ayesha"])));
    await waitFor(() => expect(result.current.data?.results).toHaveLength(1));

    rerender({ workflow: "low_confidence" });
    // Loading the new tile's list: the old tile's patients are gone.
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();

    await act(async () => calls["low_confidence"](page(["Sana"])));
    await waitFor(() =>
      expect(result.current.data?.results[0]).toMatchObject({ name: "Sana" })
    );
  });

  it("still keeps the previous rows for callers that opt in (search, paging)", async () => {
    const calls = deferred();
    const { result, rerender } = setup(true);

    await act(async () => calls["all"](page(["Ayesha"])));
    await waitFor(() => expect(result.current.data?.results).toHaveLength(1));

    rerender({ workflow: "low_confidence" });
    expect(result.current.isPending).toBe(false);
    expect(result.current.isPlaceholderData).toBe(true);
    expect(result.current.data?.results[0]).toMatchObject({ name: "Ayesha" });
  });
});
