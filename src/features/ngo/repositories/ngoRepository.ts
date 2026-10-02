import {
  DEMO_APPLICATIONS,
  DEMO_BANDS,
  DEMO_DASHBOARD_SUMMARY,
} from "../data/dummy";
import type {
  NgoBand,
  NgoBandApplication,
  NgoBandSummary,
  NgoDashboardSummary,
} from "../types";

// DEMO ONLY — in-memory state so approve/allocate actions are visible.
// A real API replaces these arrays; the method signatures stay the same.
let bands: NgoBand[] = DEMO_BANDS.map((b) => ({ ...b }));
let applications: NgoBandApplication[] = DEMO_APPLICATIONS.map((a) => ({
  ...a,
}));

const delay = () => new Promise((r) => setTimeout(r, 250));

/** The NGO data boundary. Swap the body for a real NGO API call later. */
export const ngoRepository = {
  async getDashboardSummary(): Promise<NgoDashboardSummary> {
    return DEMO_DASHBOARD_SUMMARY;
  },

  async listBands(): Promise<NgoBand[]> {
    return bands;
  },

  async listApplications(): Promise<NgoBandApplication[]> {
    return applications;
  },

  async getBandSummary(): Promise<NgoBandSummary> {
    return {
      inStock: bands.filter((b) => b.status === "in_stock").length,
      deployed: bands.filter((b) => b.status === "deployed").length,
      needsAttention: bands.filter(
        (b) =>
          b.status === "offline" ||
          b.status === "low_battery" ||
          (b.status === "deployed" && (b.batteryPercent ?? 100) < 20)
      ).length,
      pendingApplications: applications.filter((a) => a.status === "pending")
        .length,
    };
  },

  async decideApplication(
    id: string,
    status: "approved" | "rejected"
  ): Promise<void> {
    await delay();
    applications = applications.map((a) =>
      a.id === id && a.status === "pending" ? { ...a, status } : a
    );
  },

  /** Assigns the next in-stock band to an approved application. */
  async allocateBand(applicationId: string): Promise<void> {
    await delay();
    const app = applications.find((a) => a.id === applicationId);
    if (!app || app.status !== "approved" || app.allocatedBandSerial) return;
    const band = bands.find((b) => b.status === "in_stock");
    if (!band) throw new Error("No bands in stock to allocate.");
    bands = bands.map((b) =>
      b.id === band.id
        ? { ...b, status: "deployed", holderName: app.applicantName }
        : b
    );
    applications = applications.map((a) =>
      a.id === applicationId ? { ...a, allocatedBandSerial: band.serial } : a
    );
  },
};
