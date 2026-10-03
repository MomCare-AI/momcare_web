import {
  getNgoApplication,
  listNgoApplications,
  seedDemoNgoApplications,
  updateNgoApplication,
} from "@/features/ngo-onboarding/api/registerNgo";
import { REQUIRED_DOCUMENT_TYPES } from "@/features/ngo-onboarding/types";

import { SEED_HOSPITALS, SEED_NGOS } from "../data/seed";
import type {
  ActivityEvent,
  ApplicationFilters,
  HospitalAction,
  HospitalApplication,
  HospitalStatus,
  NgoAction,
  NgoApplication,
  OrgRow,
  OrgType,
  PlatformOverview,
  StatusGroup,
} from "../types";

/**
 * DEMO ONLY: the Platform Admin data boundary, backed by in-memory sample
 * data. To go real, replace each function body with a call to the
 * platform-admin API (see docs/super-admin-dashboard-plan.md, section 4);
 * the signatures, rules and callers stay the same.
 *
 * The decision rules below (allowed transitions, required reasons) are the
 * ones the backend must enforce. They live in one table each so the real API
 * and this preview cannot drift apart.
 */
let hospitals: HospitalApplication[] = SEED_HOSPITALS.map((h) => ({ ...h }));
let activity: ActivityEvent[] = [];
let nextEvent = 1;

const delay = () => new Promise((r) => setTimeout(r, 120));

async function ensureSeeded() {
  seedDemoNgoApplications(SEED_NGOS);
}

// ── Rules ────────────────────────────────────────────────────────────────

const HOSPITAL_TRANSITIONS: Record<
  HospitalStatus,
  Partial<Record<HospitalAction, HospitalStatus>>
> = {
  pending: { approve: "approved", reject: "rejected" },
  approved: { suspend: "suspended" },
  suspended: { reactivate: "approved" },
  // A rejected applicant must apply again; see plan decision D5.
  rejected: {},
};

const NGO_TRANSITIONS: Record<
  NgoApplication["status"],
  Partial<Record<NgoAction, NgoApplication["status"]>>
> = {
  pending: { start_review: "under_review" },
  under_review: { approve: "verified", reject: "rejected" },
  verified: { suspend: "suspended" },
  suspended: { reactivate: "verified" },
  rejected: {},
};

/** Actions that need a written reason. */
const REASON_REQUIRED = new Set<string>(["reject", "suspend"]);

export const availableHospitalActions = (s: HospitalStatus) =>
  Object.keys(HOSPITAL_TRANSITIONS[s]) as HospitalAction[];

export const availableNgoActions = (s: NgoApplication["status"]) =>
  Object.keys(NGO_TRANSITIONS[s]) as NgoAction[];

export const actionNeedsReason = (action: string) =>
  REASON_REQUIRED.has(action);

// ── Display mapping ──────────────────────────────────────────────────────

const HOSPITAL_GROUP: Record<HospitalStatus, StatusGroup> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  suspended: "suspended",
};

const NGO_GROUP: Record<NgoApplication["status"], StatusGroup> = {
  pending: "pending",
  under_review: "pending",
  verified: "approved",
  rejected: "rejected",
  suspended: "suspended",
};

export const HOSPITAL_STATUS_LABEL: Record<HospitalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const NGO_STATUS_LABEL: Record<NgoApplication["status"], string> = {
  pending: "Pending",
  under_review: "Under review",
  verified: "Verified by MomCare",
  rejected: "Rejected",
  suspended: "Suspended",
};

const hospitalRow = (h: HospitalApplication): OrgRow => ({
  key: `hospital:${h.id}`,
  type: "hospital",
  id: h.id,
  name: h.name,
  location: `${h.address.city}, ${h.address.state}`,
  identifier: h.licenseNumber,
  submittedAt: h.submittedAt,
  reviewedAt: h.reviewedAt,
  statusLabel: HOSPITAL_STATUS_LABEL[h.status],
  group: HOSPITAL_GROUP[h.status],
});

const ngoRow = (n: NgoApplication): OrgRow => ({
  key: `ngo:${n.id}`,
  type: "ngo",
  id: n.id,
  name: n.organization.name,
  location: `${n.organization.district}, ${n.organization.province}`,
  identifier: n.legal.registrationNumber,
  submittedAt: n.submittedAt,
  reviewedAt: null,
  statusLabel: NGO_STATUS_LABEL[n.status],
  group: NGO_GROUP[n.status],
});

const newestFirst = (a: OrgRow, b: OrgRow) =>
  Date.parse(b.submittedAt) - Date.parse(a.submittedAt);

async function allRows(): Promise<OrgRow[]> {
  await ensureSeeded();
  const ngos = await listNgoApplications();
  return [...hospitals.map(hospitalRow), ...ngos.map(ngoRow)].sort(newestFirst);
}

// ── Activity log ─────────────────────────────────────────────────────────

function record(
  by: string,
  type: OrgType,
  orgId: string,
  orgName: string,
  action: string,
  note = ""
) {
  activity = [
    {
      id: `act-${nextEvent++}`,
      at: new Date().toISOString(),
      by,
      type,
      orgId,
      orgName,
      action,
      note,
    },
    ...activity,
  ];
}

const HOSPITAL_PAST: Record<HospitalAction, string> = {
  approve: "approved",
  reject: "rejected",
  suspend: "suspended",
  reactivate: "reactivated",
};

const NGO_PAST: Record<NgoAction, string> = {
  start_review: "started reviewing",
  approve: "verified",
  reject: "rejected",
  suspend: "suspended",
  reactivate: "reactivated",
};

// ── Public API ───────────────────────────────────────────────────────────

export const platformAdminRepository = {
  async listApplications(filters: ApplicationFilters): Promise<OrgRow[]> {
    await delay();
    const q = filters.search.trim().toLowerCase();
    return (await allRows()).filter(
      (r) =>
        (filters.type === "all" || r.type === filters.type) &&
        (filters.group === "all" || r.group === filters.group) &&
        (!q ||
          r.name.toLowerCase().includes(q) ||
          r.identifier.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q))
    );
  },

  /** Organizations that have been through review and are (or were) live. */
  async listOrganizations(): Promise<OrgRow[]> {
    await delay();
    return (await allRows()).filter(
      (r) => r.group === "approved" || r.group === "suspended"
    );
  },

  async getOverview(): Promise<PlatformOverview> {
    await delay();
    const rows = await allRows();
    return {
      hospitals: rows.filter(
        (r) => r.type === "hospital" && r.group === "approved"
      ).length,
      ngos: rows.filter((r) => r.type === "ngo" && r.group === "approved")
        .length,
      pending: rows.filter((r) => r.group === "pending").length,
      activeOrganizations: rows.filter((r) => r.group === "approved").length,
      recentApplications: rows.slice(0, 5),
      recentActivity: activity.slice(0, 5),
    };
  },

  async pendingCount(): Promise<number> {
    return (await allRows()).filter((r) => r.group === "pending").length;
  },

  async listActivity(): Promise<ActivityEvent[]> {
    await delay();
    return activity;
  },

  async getHospital(id: string): Promise<HospitalApplication | null> {
    await delay();
    return hospitals.find((h) => h.id === id) ?? null;
  },

  async getNgo(id: string): Promise<NgoApplication | null> {
    await delay();
    await ensureSeeded();
    return getNgoApplication(id) ?? null;
  },

  async decideHospital(
    id: string,
    action: HospitalAction,
    note: string,
    by: string
  ): Promise<HospitalApplication> {
    await delay();
    const current = hospitals.find((h) => h.id === id);
    if (!current) throw new Error("Hospital not found.");
    const target = HOSPITAL_TRANSITIONS[current.status][action];
    if (!target) {
      throw new Error(
        `A ${HOSPITAL_STATUS_LABEL[current.status].toLowerCase()} hospital cannot be ${HOSPITAL_PAST[action]}.`
      );
    }
    const cleaned = note.trim();
    if (REASON_REQUIRED.has(action) && !cleaned) {
      throw new Error("Give a reason for this decision.");
    }
    const next: HospitalApplication = {
      ...current,
      status: target,
      reviewedAt: new Date().toISOString(),
      reviewedBy: by,
      // Always the latest decision's note, never a stale one carried over.
      reviewNote: cleaned,
    };
    hospitals = hospitals.map((h) => (h.id === id ? next : h));
    record(by, "hospital", id, current.name, HOSPITAL_PAST[action], cleaned);
    return next;
  },

  async decideNgo(
    id: string,
    action: NgoAction,
    note: string,
    by: string
  ): Promise<NgoApplication> {
    await delay();
    await ensureSeeded();
    const current = getNgoApplication(id);
    if (!current) throw new Error("NGO application not found.");
    const target = NGO_TRANSITIONS[current.status][action];
    if (!target) {
      throw new Error(
        `A ${NGO_STATUS_LABEL[current.status].toLowerCase()} application cannot be ${NGO_PAST[action]}.`
      );
    }
    const cleaned = note.trim();
    if (REASON_REQUIRED.has(action) && !cleaned) {
      throw new Error("Give a reason for this decision.");
    }
    if (action === "approve") {
      // An uploaded certificate never verifies an NGO by itself: the admin
      // must have checked the two required documents first.
      const unverified = REQUIRED_DOCUMENT_TYPES.some(
        (t) =>
          !current.documents.some(
            (d) => d.type === t && d.status === "verified"
          )
      );
      if (unverified) {
        throw new Error(
          "Verify the registration certificate and the authorization letter before verifying this NGO."
        );
      }
    }
    const next = updateNgoApplication(id, (a) => ({
      ...a,
      status: target,
      statusReason: REASON_REQUIRED.has(action) ? cleaned : null,
    }));
    record(by, "ngo", id, current.organization.name, NGO_PAST[action], cleaned);
    return next;
  },

  async decideNgoDocument(
    id: string,
    documentId: string,
    decision: "verified" | "rejected",
    reason: string,
    by: string
  ): Promise<NgoApplication> {
    await delay();
    await ensureSeeded();
    const current = getNgoApplication(id);
    if (!current) throw new Error("NGO application not found.");
    if (current.status !== "under_review") {
      throw new Error("Start the review before checking documents.");
    }
    const doc = current.documents.find((d) => d.id === documentId);
    if (!doc) throw new Error("Document not found.");
    const cleaned = reason.trim();
    if (decision === "rejected" && !cleaned) {
      throw new Error("Give a reason for rejecting this document.");
    }
    const next = updateNgoApplication(id, (a) => ({
      ...a,
      documents: a.documents.map((d) =>
        d.id === documentId
          ? {
              ...d,
              status: decision,
              rejectionReason: decision === "rejected" ? cleaned : null,
            }
          : d
      ),
    }));
    record(
      by,
      "ngo",
      id,
      current.organization.name,
      decision === "verified"
        ? "verified a document of"
        : "rejected a document of",
      cleaned
    );
    return next;
  },

  async requestNgoInfo(
    id: string,
    message: string,
    by: string
  ): Promise<NgoApplication> {
    await delay();
    await ensureSeeded();
    const current = getNgoApplication(id);
    if (!current) throw new Error("NGO application not found.");
    if (current.status !== "pending" && current.status !== "under_review") {
      throw new Error("Information can only be requested during review.");
    }
    const cleaned = message.trim();
    if (!cleaned) throw new Error("Write what information you need.");
    const next = updateNgoApplication(id, (a) => ({
      ...a,
      infoRequests: [
        ...a.infoRequests,
        {
          id: `info-${a.infoRequests.length + 1}`,
          message: cleaned,
          at: new Date().toISOString(),
        },
      ],
    }));
    record(
      by,
      "ngo",
      id,
      current.organization.name,
      "asked for more information from",
      cleaned
    );
    return next;
  },

  /** Test hook: back to the sample data and an empty activity log. */
  resetForTests() {
    hospitals = SEED_HOSPITALS.map((h) => ({ ...h }));
    activity = [];
    nextEvent = 1;
  },
};
