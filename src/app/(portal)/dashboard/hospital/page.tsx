"use client";

import { Building2, MapPin, ShieldCheck } from "lucide-react";

import { usePortal } from "../layout";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * The hospital's own record — what was submitted at onboarding and what the
 * platform derived from it.
 *
 * Everything here is read-only. The licence and address were verified during
 * the review gate; changing them from a settings screen would let a hospital
 * quietly alter the evidence its approval rested on. A correction goes through
 * a platform administrator, the same as the original review did.
 */

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mc-pair-label">{label}</div>
      <div className="mc-pair-value">{value || "—"}</div>
    </div>
  );
}

export default function HospitalPage() {
  usePageTitle("Hospital");
  const { org } = usePortal();

  const address = [org.address_line1, org.address_line2, org.city, org.state]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">{org.name}</h1>
          <p className="mc-sub">
            What this hospital submitted at onboarding, and what the platform
            derived from it.
          </p>
        </div>
        <div className="mc-head-aside">
          <span
            className={`mc-badge mc-badge-${org.status === "approved" ? "stable" : "neutral"}`}
          >
            {org.status_display}
          </span>
        </div>
      </div>

      <div className="mc-card">
        <div className="mc-card-head">
          <span className="mc-card-title">
            <Building2 size={16} strokeWidth={1.9} aria-hidden /> Overview
          </span>
        </div>
        <div className="mc-card-body">
          <div className="mc-pairs">
            <Pair label="Owner" value={org.owner_name} />
            <Pair label="Email" value={org.email} />
            <Pair label="Phone" value={org.phone} />
            <Pair label="Staff" value={String(org.staff_count)} />
            <Pair label="Patients" value={String(org.patient_count)} />
            <Pair label="Locations" value={String(org.location_count)} />
          </div>
        </div>
      </div>

      <div className="mc-card">
        <div className="mc-card-head">
          <span className="mc-card-title">
            <MapPin size={16} strokeWidth={1.9} aria-hidden /> Address
          </span>
        </div>
        <div className="mc-card-body">
          <div className="mc-pairs">
            <Pair label="Address" value={address} />
            <Pair label="Country" value={org.country} />
          </div>
        </div>
      </div>

      <div className="mc-card">
        <div className="mc-card-head">
          <span className="mc-card-title">
            <ShieldCheck size={16} strokeWidth={1.9} aria-hidden /> Licence and
            region
          </span>
        </div>
        <div className="mc-card-body">
          <div className="mc-pairs">
            <Pair label="Licence number" value={org.license_no} />
            <Pair
              label="Issuing authority"
              value={org.license_authority_display}
            />
            <Pair label="Risk model region" value={org.region_display} />
          </div>
          <p className="mc-hint" style={{ marginTop: 14 }}>
            {org.region
              ? "Set automatically from the country above. Risk predictions use data for this population."
              : "No model has been trained for this population, so risk is assessed by clinical rules instead."}
          </p>
        </div>
      </div>

      <p className="mc-hint">
        To correct any of this, contact platform support — these fields were
        verified during your hospital&apos;s review and are not editable from
        here.
      </p>
    </>
  );
}
