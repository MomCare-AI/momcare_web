export const REGISTRATION_AUTHORITIES = [
  "Securities and Exchange Commission of Pakistan (SECP)",
  "Social Welfare Department",
  "Registrar of Societies",
  "Charity Commission",
  "Other",
] as const;

export const REGISTRATION_TYPES = [
  "Section 42 Company",
  "Voluntary Social Welfare Agency",
  "Registered Society",
  "Registered Charity",
  "Trust",
  "Other",
] as const;

export const DESIGNATIONS = [
  "Director",
  "CEO",
  "Chairman",
  "Secretary",
  "President",
  "Founder",
  "Authorized Representative",
  "Other",
] as const;

export const DOCUMENT_TYPES = [
  { value: "registration_certificate", label: "Registration Certificate" },
  {
    value: "incorporation_certificate",
    label: "Registration / Incorporation Certificate",
  },
  { value: "renewal_certificate", label: "Renewal Certificate" },
  { value: "authorization_letter", label: "Authorization Letter" },
  { value: "ntn_document", label: "NTN / Tax Document" },
  { value: "other", label: "Other Supporting Document" },
] as const;

export type NgoDocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

/** Without these two the application cannot be submitted. */
export const REQUIRED_DOCUMENT_TYPES: NgoDocumentType[] = [
  "registration_certificate",
  "authorization_letter",
];

export const documentLabel = (type: NgoDocumentType) =>
  DOCUMENT_TYPES.find((d) => d.value === type)?.label ?? type;

/** A file the applicant picked, before it is submitted. */
export interface NgoDocumentInput {
  id: string;
  type: NgoDocumentType;
  file: File;
}

export type NgoApplicationStatus =
  "pending" | "under_review" | "verified" | "rejected" | "suspended";

export type DocumentStatus = "pending" | "verified" | "rejected";

export interface NgoApplicationDocument {
  id: string;
  type: NgoDocumentType;
  fileName: string;
  sizeBytes: number;
  status: DocumentStatus;
  rejectionReason: string | null;
}

/** A submitted application, as MomCare staff see it. */
export interface NgoApplication {
  id: string;
  status: NgoApplicationStatus;
  /** Reason given on reject / suspend. */
  statusReason: string | null;
  submittedAt: string;
  organization: {
    name: string;
    email: string;
    phone: string;
    website: string;
    province: string;
    district: string;
    address: string;
    areasOfOperation: string[];
  };
  legal: {
    authority: string;
    type: string;
    registrationNumber: string;
    registrationDate: string;
    expiryDate: string;
    ntn: string;
  };
  representative: {
    name: string;
    cnic: string;
    designation: string;
    email: string;
    phone: string;
  };
  documents: NgoApplicationDocument[];
  /** Messages MomCare sent asking for more information. */
  infoRequests: { id: string; message: string; at: string }[];
}
