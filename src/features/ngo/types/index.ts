export interface NgoSession {
  email: string;
  organizationName: string;
  displayName: string;
}

export interface NgoDashboardSummary {
  activePrograms: number;
  registeredBeneficiaries: number;
  reportsAvailable: number;
  unreadMessages: number;
}

export type BandStatus =
  | "in_stock"
  | "deployed"
  | "offline"
  | "low_battery"
  | "recall_pending"
  | "returned"
  | "retired";

export type BandEventType =
  | "added"
  | "allocated"
  | "recall_requested"
  | "returned"
  | "restocked"
  | "retired";

export interface BandEvent {
  id: string;
  at: string;
  type: BandEventType;
  note: string;
}

/** An NGO-owned band, on loan once deployed (see docs/ngo-portal-design.md). */
export interface NgoBand {
  /** Newest last. Written by the repository, never by the UI. */
  events: BandEvent[];
  id: string;
  serial: string;
  batch: string;
  status: BandStatus;
  batteryPercent: number | null;
  lastSyncAt: string | null;
  /** Beneficiary and hospital are shown by name only — no clinical data. */
  holderName: string | null;
  hospitalName: string | null;
}

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface NgoBandApplication {
  id: string;
  applicantName: string;
  area: string;
  source: "mother_app" | "hospital";
  requestedAt: string;
  status: ApplicationStatus;
  allocatedBandSerial: string | null;
}

export interface NgoBandSummary {
  inStock: number;
  deployed: number;
  needsAttention: number;
  pendingApplications: number;
}

export type NgoService = "bands" | "ambulance";

/** An NGO's request for a portal account. Reviewed by MomCare, never self-served. */
export interface NgoAccessRequest {
  organizationName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  services: NgoService[];
  message: string;
}
