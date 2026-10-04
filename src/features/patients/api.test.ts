import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDashboardKpis, listPatients } from "./api";

const authJson = vi.fn();
vi.mock("@/core/api/authFetch", () => ({
  authJson: (url: string) => authJson(url),
  authFetch: vi.fn(),
}));

beforeEach(() => authJson.mockReset().mockResolvedValue({}));

describe("location-scoped patient requests", () => {
  it("asks for one site's tile counts when a location is chosen", async () => {
    await getDashboardKpis("loc-1");
    expect(authJson).toHaveBeenCalledWith(
      "/api/patients/dashboard-kpis/?location=loc-1"
    );
  });

  it("asks for the whole roster when no location is chosen", async () => {
    await getDashboardKpis();
    await getDashboardKpis(null);
    expect(authJson).toHaveBeenNthCalledWith(
      1,
      "/api/patients/dashboard-kpis/"
    );
    expect(authJson).toHaveBeenNthCalledWith(
      2,
      "/api/patients/dashboard-kpis/"
    );
  });

  it("sends the location together with a workflow filter, so the list matches the tile", async () => {
    await listPatients({
      pageSize: 100,
      workflow: "risk_review",
      location: "loc-1",
    });
    const url = authJson.mock.calls[0][0] as string;
    const query = new URLSearchParams(url.split("?")[1]);
    expect(query.get("location")).toBe("loc-1");
    expect(query.get("workflow")).toBe("risk_review");
    expect(query.get("page_size")).toBe("100");
  });

  it("leaves the location off when none is selected", async () => {
    await listPatients({ workflow: "low_confidence", location: null });
    expect(authJson.mock.calls[0][0]).not.toContain("location");
  });
});
