"use client";

import { useState } from "react";
import { Building2, MapPin, ShieldCheck } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import {
  useUpdateOrganization,
  type OrganizationUpdateInput,
} from "@/features/portal/hooks/usePortalData";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { Pair } from "@/shared/ui/Pair";

/**
 * The hospital's own record — what was submitted at onboarding and what the
 * platform derived from it.
 *
 * Region, status, license_image and the three counts stay read-only (server-
 * derived, or evidence the review rested on) — everything else here is now
 * genuinely editable by a hospital admin, unlike before this backend push.
 */

function toFormState(org: {
  name: string;
  license_number: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  timezone: string;
  date_format: string;
  established_date: string | null;
}): OrganizationUpdateInput {
  return {
    name: org.name,
    license_number: org.license_number,
    email: org.email,
    phone: org.phone,
    address_line1: org.address_line1,
    address_line2: org.address_line2,
    city: org.city,
    state: org.state,
    postal_code: org.postal_code,
    country: org.country,
    timezone: org.timezone,
    date_format: org.date_format,
    established_date: org.established_date,
  };
}

export function HospitalTab() {
  const { org, isHospitalAdmin } = usePortal();
  const updateOrg = useUpdateOrganization();
  const [form, setForm] = useState<OrganizationUpdateInput>(() =>
    toFormState(org)
  );
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof OrganizationUpdateInput>(
    key: K,
    value: OrganizationUpdateInput[K]
  ) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg.mutate(form, { onSuccess: () => setSaved(true) });
  };

  return (
    <>
      <div className="mc-head">
        <div>
          <p className="mc-sub">{org.name}</p>
        </div>
        <div className="mc-head-aside">
          <span
            className={`mc-badge mc-badge-${org.status === "approved" ? "stable" : "neutral"}`}
          >
            {org.status_display}
          </span>
        </div>
      </div>

      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <span className="mc-card-title">
              <Building2 size={16} strokeWidth={1.9} aria-hidden /> Overview
            </span>
          </CardHeader>
          <CardBody>
            <div className="mc-formgrid">
              <div>
                <label className="mc-label" htmlFor="org-name">
                  Hospital name
                </label>
                <input
                  id="org-name"
                  className="mc-input"
                  value={form.name}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="org-license">
                  Licence number
                </label>
                <input
                  id="org-license"
                  className="mc-input"
                  value={form.license_number}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("license_number", e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="org-email">
                  Contact email
                </label>
                <input
                  id="org-email"
                  type="email"
                  className="mc-input"
                  value={form.email}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="org-phone">
                  Phone
                </label>
                <input
                  id="org-phone"
                  className="mc-input"
                  value={form.phone}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
            </div>
            <div className="mc-pairs" style={{ marginTop: 18 }}>
              <Pair label="Owner" value={org.owner_name} />
              <Pair label="Staff" value={String(org.staff_count)} />
              <Pair label="Patients" value={String(org.patient_count)} />
              <Pair label="Locations" value={String(org.location_count)} />
            </div>
          </CardBody>

          <CardHeader style={{ borderTop: "1px solid var(--c-border-soft)" }}>
            <span className="mc-card-title">
              <MapPin size={16} strokeWidth={1.9} aria-hidden /> Address
            </span>
          </CardHeader>
          <CardBody>
            <div className="mc-formgrid">
              <div>
                <label className="mc-label" htmlFor="org-address1">
                  Address line 1
                </label>
                <input
                  id="org-address1"
                  className="mc-input"
                  value={form.address_line1}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("address_line1", e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="org-address2">
                  Address line 2
                </label>
                <input
                  id="org-address2"
                  className="mc-input"
                  value={form.address_line2}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("address_line2", e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="org-city">
                  City
                </label>
                <input
                  id="org-city"
                  className="mc-input"
                  value={form.city}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("city", e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="org-state">
                  State / province
                </label>
                <input
                  id="org-state"
                  className="mc-input"
                  value={form.state}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("state", e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="org-postal">
                  Postal code
                </label>
                <input
                  id="org-postal"
                  className="mc-input"
                  value={form.postal_code}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("postal_code", e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="org-country">
                  Country
                </label>
                <input
                  id="org-country"
                  className="mc-input"
                  value={form.country}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("country", e.target.value)}
                />
                <span className="mc-hint">
                  Changing the country changes which population the risk model
                  treats this hospital as.
                </span>
              </div>
            </div>
          </CardBody>

          <CardHeader style={{ borderTop: "1px solid var(--c-border-soft)" }}>
            <span className="mc-card-title">
              <ShieldCheck size={16} strokeWidth={1.9} aria-hidden /> Region
              &amp; formatting
            </span>
          </CardHeader>
          <CardBody>
            <div className="mc-pairs" style={{ marginBottom: 18 }}>
              <Pair label="Risk model region" value={org.region_display} />
            </div>
            <p className="mc-hint" style={{ marginBottom: 18 }}>
              {org.region
                ? "Set automatically from the country above. Risk predictions use data for this population."
                : "No model has been trained for this population, so risk is assessed by clinical rules instead."}
            </p>
            <div className="mc-formgrid">
              <div>
                <label className="mc-label" htmlFor="org-timezone">
                  Timezone
                </label>
                <input
                  id="org-timezone"
                  className="mc-input"
                  value={form.timezone}
                  disabled={!isHospitalAdmin}
                  placeholder="e.g. Asia/Karachi"
                  onChange={(e) => set("timezone", e.target.value)}
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="org-date-format">
                  Date format
                </label>
                <select
                  id="org-date-format"
                  className="mc-input"
                  value={form.date_format}
                  disabled={!isHospitalAdmin}
                  onChange={(e) => set("date_format", e.target.value)}
                >
                  <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                  <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </CardBody>

          {isHospitalAdmin && (
            <div className="mc-card-foot">
              {updateOrg.isError && (
                <p className="mc-alert mc-alert-error">
                  {updateOrg.error instanceof Error
                    ? updateOrg.error.message
                    : "Could not save these changes."}
                </p>
              )}
              {saved && !updateOrg.isPending && (
                <p className="mc-alert mc-alert-success">Saved.</p>
              )}
              <button
                type="submit"
                className="mc-btn"
                disabled={updateOrg.isPending}
              >
                {updateOrg.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </Card>
      </form>

      {!isHospitalAdmin && (
        <p className="mc-hint">
          Only a hospital administrator can edit this record.
        </p>
      )}
    </>
  );
}
