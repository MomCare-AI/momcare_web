import {
  DEMO_APPLICATIONS,
  DEMO_BANDS,
  DEMO_DASHBOARD_SUMMARY,
} from "../data/dummy";
import type {
  BandEventType,
  BandStatus,
  NgoBand,
  NgoBandApplication,
  NgoBandSummary,
  NgoDashboardSummary,
} from "../types";

// DEMO ONLY — in-memory state so actions are visible without a backend.
// A real API replaces these arrays; the method signatures stay the same.
let nextEventId = 1;
const event = (
  type: BandEventType,
  note: string,
  at = new Date().toISOString()
) => ({
  id: `ev${nextEventId++}`,
  at,
  type,
  note,
});

let bands: NgoBand[] = DEMO_BANDS.map((b) => ({
  ...b,
  events: [event("added", `Batch ${b.batch}`, "2026-09-01T09:00:00Z")],
}));
let applications: NgoBandApplication[] = DEMO_APPLICATIONS.map((a) => ({
  ...a,
}));

const delay = () => new Promise((r) => setTimeout(r, 250));

const IN_FIELD: BandStatus[] = [
  "deployed",
  "offline",
  "low_battery",
  "recall_pending",
];

function update(id: string, change: (b: NgoBand) => NgoBand) {
  bands = bands.map((b) => (b.id === id ? change(b) : b));
}

function find(id: string): NgoBand {
  const band = bands.find((b) => b.id === id);
  if (!band) throw new Error("Band not found.");
  return band;
}

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
          b.status === "recall_pending" ||
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
    update(band.id, (b) => ({
      ...b,
      status: "deployed",
      holderName: app.applicantName,
      events: [
        ...b.events,
        event("allocated", `Allocated to ${app.applicantName}`),
      ],
    }));
    applications = applications.map((a) =>
      a.id === applicationId ? { ...a, allocatedBandSerial: band.serial } : a
    );
  },

  /** Registers `quantity` new in-stock bands under one batch label. */
  async addBands(batch: string, quantity: number): Promise<NgoBand[]> {
    await delay();
    const label = batch.trim();
    if (!label) throw new Error("Enter a batch label.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 200) {
      throw new Error("Quantity must be a whole number from 1 to 200.");
    }
    const highest = bands.reduce((max, b) => {
      const n = Number(b.serial.replace(/\D/g, ""));
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
    const created: NgoBand[] = Array.from({ length: quantity }, (_, i) => {
      const serial = `MCB-${String(highest + i + 1).padStart(4, "0")}`;
      return {
        id: `b-${serial}`,
        serial,
        batch: label,
        status: "in_stock",
        batteryPercent: 100,
        lastSyncAt: null,
        holderName: null,
        hospitalName: null,
        events: [event("added", `Batch ${label}`)],
      };
    });
    bands = [...bands, ...created];
    return created;
  },

  /** NGO asks for a deployed band back. */
  async requestRecall(id: string, reason: string): Promise<void> {
    await delay();
    const band = find(id);
    if (!IN_FIELD.includes(band.status) || band.status === "recall_pending") {
      throw new Error("Only a band in the field can be recalled.");
    }
    update(id, (b) => ({
      ...b,
      status: "recall_pending",
      events: [
        ...b.events,
        event("recall_requested", reason.trim() || "Recall requested"),
      ],
    }));
  },

  /** The band is physically back with the NGO. */
  async markReturned(id: string): Promise<void> {
    await delay();
    const band = find(id);
    if (!IN_FIELD.includes(band.status)) {
      throw new Error("Only a band in the field can be marked returned.");
    }
    update(id, (b) => ({
      ...b,
      status: "returned",
      holderName: null,
      events: [
        ...b.events,
        event(
          "returned",
          band.holderName ? `Returned by ${band.holderName}` : "Returned"
        ),
      ],
    }));
  },

  /** A returned band is checked and made available again. */
  async restock(id: string): Promise<void> {
    await delay();
    if (find(id).status !== "returned") {
      throw new Error("Only a returned band can be restocked.");
    }
    update(id, (b) => ({
      ...b,
      status: "in_stock",
      hospitalName: null,
      events: [
        ...b.events,
        event("restocked", "Checked and returned to stock"),
      ],
    }));
  },

  /** Permanently takes a band out of circulation. */
  async retire(id: string, reason: string): Promise<void> {
    await delay();
    const band = find(id);
    if (band.status !== "in_stock" && band.status !== "returned") {
      throw new Error("Return the band before retiring it.");
    }
    if (!reason.trim())
      throw new Error("Give a reason for retiring this band.");
    update(id, (b) => ({
      ...b,
      status: "retired",
      holderName: null,
      hospitalName: null,
      events: [...b.events, event("retired", reason.trim())],
    }));
  },
};
