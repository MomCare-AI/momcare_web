import type {
  Step1Data,
  OrgStep1Data,
  OrgStep2Data,
  OrgStep3Data,
} from "../components/hwSchemas";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type WizardFormData = Step1Data &
  OrgStep1Data &
  OrgStep2Data &
  OrgStep3Data;

/** Registration is an application, not a sign-up: the backend issues no tokens
 *  until a platform admin approves the hospital, so there's nothing to store. */
export interface RegisterResponse {
  detail: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  organization_name: string;
  email: string;
}

export interface ApiError {
  field?: string;
  message: string;
}

export async function registerHospital(
  form: WizardFormData
): Promise<RegisterResponse> {
  const payload = {
    // Personal — camelCase → snake_case
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    password: form.password,
    phone: form.phoneNumber ?? "",
    gender: form.gender ?? "",
    // Org identity
    org_name: form.orgName,
    // Org contact
    org_email: form.contactEmail,
    org_phone: form.contactPhone,
    // Org location
    address_line1: form.addressLine1,
    address_line2: form.addressLine2 ?? "",
    city: form.city,
    state: form.stateProvince,
    postal_code: form.postalCode,
    country: form.country,
    license_no: form.licenseNo ?? "",
    license_authority: form.licenseAuthority ?? "",
  };

  const res = await fetch(`${API_BASE}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // DRF validation errors are nested under field names
    const firstError =
      body.email?.[0] ??
      body.phone?.[0] ??
      body.org_name?.[0] ??
      body.non_field_errors?.[0] ??
      body.detail ??
      "Registration failed. Please try again.";
    throw new Error(firstError);
  }

  return res.json() as Promise<RegisterResponse>;
}
