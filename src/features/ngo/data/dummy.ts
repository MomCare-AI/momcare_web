import type { NgoDashboardSummary, NgoSession } from "../types";

/**
 * DEMO ONLY — frontend placeholder data until a real NGO API exists.
 * Nothing here comes from, or is linked to, the hospital/clinical system.
 */
export const DEMO_NGO_CREDENTIALS = {
  email: "ngo1@co.com",
  password: "ngo123#",
} as const;

export const DEMO_NGO_SESSION: NgoSession = {
  email: DEMO_NGO_CREDENTIALS.email,
  organizationName: "MomCare NGO",
  displayName: "NGO Admin",
};

export const DEMO_DASHBOARD_SUMMARY: NgoDashboardSummary = {
  activePrograms: 12,
  registeredBeneficiaries: 248,
  reportsAvailable: 8,
  unreadMessages: 3,
};

// DEMO ONLY — band program placeholder data.
export const DEMO_BANDS: import("../types").NgoBand[] = [
  {
    id: "b1",
    serial: "MCB-0001",
    batch: "2026-A",
    status: "deployed",
    batteryPercent: 82,
    lastSyncAt: "2026-10-02T08:10:00Z",
    holderName: "Ayesha Khan",
    hospitalName: "City Women's Hospital",
  },
  {
    id: "b2",
    serial: "MCB-0002",
    batch: "2026-A",
    status: "deployed",
    batteryPercent: 14,
    lastSyncAt: "2026-10-02T06:40:00Z",
    holderName: "Sana Iqbal",
    hospitalName: "City Women's Hospital",
  },
  {
    id: "b3",
    serial: "MCB-0003",
    batch: "2026-A",
    status: "offline",
    batteryPercent: 55,
    lastSyncAt: "2026-09-29T17:00:00Z",
    holderName: "Mariam Bibi",
    hospitalName: "District Health Center",
  },
  {
    id: "b4",
    serial: "MCB-0004",
    batch: "2026-B",
    status: "in_stock",
    batteryPercent: 100,
    lastSyncAt: null,
    holderName: null,
    hospitalName: null,
  },
  {
    id: "b5",
    serial: "MCB-0005",
    batch: "2026-B",
    status: "in_stock",
    batteryPercent: 100,
    lastSyncAt: null,
    holderName: null,
    hospitalName: null,
  },
  {
    id: "b6",
    serial: "MCB-0006",
    batch: "2026-B",
    status: "returned",
    batteryPercent: 40,
    lastSyncAt: "2026-09-20T10:00:00Z",
    holderName: null,
    hospitalName: "District Health Center",
  },
];

export const DEMO_APPLICATIONS: import("../types").NgoBandApplication[] = [
  {
    id: "a1",
    applicantName: "Hina Aslam",
    area: "Rawalpindi",
    source: "mother_app",
    requestedAt: "2026-10-01T09:00:00Z",
    status: "pending",
    allocatedBandSerial: null,
  },
  {
    id: "a2",
    applicantName: "Rabia Noor",
    area: "Attock",
    source: "hospital",
    requestedAt: "2026-09-30T12:30:00Z",
    status: "pending",
    allocatedBandSerial: null,
  },
  {
    id: "a3",
    applicantName: "Zainab Ali",
    area: "Islamabad",
    source: "mother_app",
    requestedAt: "2026-09-27T15:00:00Z",
    status: "approved",
    allocatedBandSerial: null,
  },
];
