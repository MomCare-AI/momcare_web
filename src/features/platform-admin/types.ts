import type { NgoApplication } from "@/features/ngo-onboarding/types";

export type { NgoApplication };

export type OrgType = "hospital" | "ngo";

/** Hospital statuses mirror the backend's `Organization.status`. */
export type HospitalStatus = "pending" | "approved" | "rejected" | "suspended";

/**
 * A hospital's application *is* its `Organization` row while it is pending —
 * there is no separate application table on the backend, so none here.
 */
export interface HospitalApplication {
  id: string;
  name: string;
  status: HospitalStatus;
  submittedAt: string;
  owner: { name: string; email: string; phone: string };
  contact: { email: string; phone: string };
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  licenseNumber: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNote: string;
}

export type HospitalAction = "approve" | "reject" | "suspend" | "reactivate";

export type NgoAction =
  "start_review" | "approve" | "reject" | "suspend" | "reactivate";

/** Statuses grouped for the shared inbox tabs, whatever the organization type. */
export type StatusGroup = "pending" | "approved" | "rejected" | "suspended";

/** What the inbox and directory show; a display shape, not a domain model. */
export interface OrgRow {
  key: string;
  type: OrgType;
  id: string;
  name: string;
  location: string;
  /** Licence number (hospital) or registration number (NGO). */
  identifier: string;
  submittedAt: string;
  reviewedAt: string | null;
  statusLabel: string;
  group: StatusGroup;
}

export interface ActivityEvent {
  id: string;
  at: string;
  by: string;
  type: OrgType;
  orgId: string;
  orgName: string;
  /** Human sentence fragment, e.g. "approved", "rejected a document of". */
  action: string;
  note: string;
}

export interface PlatformOverview {
  hospitals: number;
  ngos: number;
  pending: number;
  activeOrganizations: number;
  recentApplications: OrgRow[];
  recentActivity: ActivityEvent[];
}

export interface ApplicationFilters {
  type: OrgType | "all";
  group: StatusGroup | "all";
  search: string;
}

export const GROUP_LABEL: Record<StatusGroup, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};
