import { validateDocumentFile } from "@/shared/registration/documents";

import {
  REQUIRED_DOCUMENT_TYPES,
  type NgoApplication,
  type NgoDocumentInput,
} from "../types";
import {
  legalSchema,
  orgInfoSchema,
  representativeSchema,
  type NgoRegistrationData,
} from "../schemas";

/**
 * DEMO ONLY: applications live in this module's memory. Ahmed's backend will
 * own storage; `submitNgoApplication` becomes a multipart POST and
 * `listNgoApplications` the admin list endpoint. Files are never kept: only
 * their name and size are recorded, so no identity document sits in the
 * browser.
 */
let applications: NgoApplication[] = [];
let nextId = 1;

const delay = () => new Promise((r) => setTimeout(r, 400));

export async function submitNgoApplication(
  data: NgoRegistrationData,
  documents: NgoDocumentInput[]
): Promise<NgoApplication> {
  await delay();

  // Stand-in for server-side validation: never trust the form alone.
  orgInfoSchema.parse(data);
  legalSchema.parse(data);
  representativeSchema.parse(data);
  for (const type of REQUIRED_DOCUMENT_TYPES) {
    if (!documents.some((d) => d.type === type)) {
      throw new Error("Upload every required document before submitting.");
    }
  }
  for (const d of documents) {
    const problem = validateDocumentFile(d.file);
    if (problem) throw new Error(`${d.file.name}: ${problem}`);
  }

  const application: NgoApplication = {
    id: `ngo-${nextId++}`,
    status: "pending",
    statusReason: null,
    submittedAt: new Date().toISOString(),
    organization: {
      name: data.orgName,
      email: data.orgEmail,
      phone: data.orgPhone,
      website: data.website,
      province: data.province,
      district: data.district,
      address: data.address,
      areasOfOperation: data.areasOfOperation,
    },
    legal: {
      authority: data.authority,
      type: data.registrationType,
      registrationNumber: data.registrationNumber,
      registrationDate: data.registrationDate,
      expiryDate: data.expiryDate,
      ntn: data.ntn,
    },
    representative: {
      name: data.repName,
      cnic: data.cnic,
      designation: data.designation,
      email: data.repEmail,
      phone: data.repPhone,
    },
    documents: documents.map((d) => ({
      id: d.id,
      type: d.type,
      fileName: d.file.name,
      sizeBytes: d.file.size,
      status: "pending",
      rejectionReason: null,
    })),
    infoRequests: [],
  };
  applications = [application, ...applications];
  return application;
}

export async function listNgoApplications(): Promise<NgoApplication[]> {
  await delay();
  return applications;
}

// ── Hooks for the Platform Admin preview (DEMO ONLY) ─────────────────────
// The admin screens read and update the same in-memory store the wizard
// writes to, so an application submitted at /register/ngo shows up there.
let seeded = false;

/** Adds sample applications once; later calls do nothing. */
export function seedDemoNgoApplications(items: NgoApplication[]): void {
  if (seeded) return;
  seeded = true;
  applications = [...applications, ...items.map((a) => structuredClone(a))];
}

export function getNgoApplication(id: string): NgoApplication | undefined {
  return applications.find((a) => a.id === id);
}

export function updateNgoApplication(
  id: string,
  change: (a: NgoApplication) => NgoApplication
): NgoApplication {
  const current = getNgoApplication(id);
  if (!current) throw new Error("Application not found.");
  const next = change(current);
  applications = applications.map((a) => (a.id === id ? next : a));
  return next;
}
