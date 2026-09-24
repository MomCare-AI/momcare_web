"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, ShieldCheck } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import {
  useUpdateOrganization,
  type OrganizationUpdateInput,
} from "@/features/portal/hooks/usePortalData";
import { CardBody, CardHeader } from "@/shared/ui/Card";
import { Modal } from "@/shared/ui/Modal";
import { Pair } from "@/shared/ui/Pair";

interface Props {
  open: boolean;
  onClose: () => void;
}

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

/**
 * The hospital's own record — what was submitted at onboarding and what the
 * platform derived from it. Opened from the edit icon on GovernanceStatsHeader,
 * matching the reference platform's own pattern (an "Edit organization" action
 * on the persistent header card, not a dedicated governance tab).
 *
 * Region, status, license_image and the three counts stay read-only (server-
 * derived, or evidence the review rested on) — everything else here is
 * genuinely editable by a hospital admin.
 */
export function EditOrganizationModal({ open, onClose }: Props) {
  const { org } = usePortal();
  const updateOrg = useUpdateOrganization();
  const [form, setForm] = useState<OrganizationUpdateInput>(() =>
    toFormState(org)
  );
  const [saved, setSaved] = useState(false);

  // Re-sync from the live org record every time the modal opens, so a
  // cancelled edit never lingers into the next open.
  useEffect(() => {
    if (open) {
      setForm(toFormState(org));
      setSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    <Modal
      open={open}
      onClose={onClose}
      title="Edit organization"
      subtitle="Update the hospital's own record"
    >
      <form onSubmit={submit}>
        <CardHeader style={{ padding: "0 0 16px" }}>
          <span className="mc-card-title">
            <Building2 size={16} strokeWidth={1.9} aria-hidden /> Overview
          </span>
        </CardHeader>
        <CardBody style={{ padding: "0 0 20px" }}>
          <div className="mc-formgrid">
            <div>
              <label className="mc-label" htmlFor="org-name">
                Hospital name
              </label>
              <input
                id="org-name"
                className="mc-input"
                value={form.name}
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
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
          </div>
          <div className="mc-pairs">
            <Pair label="Owner" value={org.owner_name} />
            <Pair label="Staff" value={String(org.staff_count)} />
            <Pair label="Patients" value={String(org.patient_count)} />
            <Pair label="Locations" value={String(org.location_count)} />
          </div>
        </CardBody>

        <CardHeader
          style={{
            padding: "16px 0",
            borderTop: "1px solid var(--c-border-soft)",
          }}
        >
          <span className="mc-card-title">
            <MapPin size={16} strokeWidth={1.9} aria-hidden /> Address
          </span>
        </CardHeader>
        <CardBody style={{ padding: "0 0 20px" }}>
          <div className="mc-formgrid" style={{ marginBottom: 0 }}>
            <div>
              <label className="mc-label" htmlFor="org-address1">
                Address line 1
              </label>
              <input
                id="org-address1"
                className="mc-input"
                value={form.address_line1}
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
                onChange={(e) => set("country", e.target.value)}
              />
              <span className="mc-hint">
                Changing the country changes which population the risk model
                treats this hospital as.
              </span>
            </div>
          </div>
        </CardBody>

        <CardHeader
          style={{
            padding: "16px 0",
            borderTop: "1px solid var(--c-border-soft)",
          }}
        >
          <span className="mc-card-title">
            <ShieldCheck size={16} strokeWidth={1.9} aria-hidden /> Region &amp;
            formatting
          </span>
        </CardHeader>
        <CardBody style={{ padding: "0" }}>
          <div className="mc-pairs" style={{ marginBottom: 18 }}>
            <Pair label="Risk model region" value={org.region_display} />
          </div>
          <p className="mc-hint" style={{ marginBottom: 18 }}>
            {org.region
              ? "Set automatically from the country above. Risk predictions use data for this population."
              : "No model has been trained for this population, so risk is assessed by clinical rules instead."}
          </p>
          <div className="mc-formgrid" style={{ marginBottom: 0 }}>
            <div>
              <label className="mc-label" htmlFor="org-timezone">
                Timezone
              </label>
              <input
                id="org-timezone"
                className="mc-input"
                value={form.timezone}
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
                onChange={(e) => set("date_format", e.target.value)}
              >
                <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </CardBody>

        <div
          className="mc-card-foot"
          style={{
            padding: "16px 0 0",
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
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
            type="button"
            className="mc-btn-ghost"
            onClick={onClose}
            style={{ marginLeft: "auto" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mc-btn"
            disabled={updateOrg.isPending}
          >
            {updateOrg.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
