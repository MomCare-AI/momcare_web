"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, MapPin, ShieldCheck } from "lucide-react";

import { usePortal } from "../layout";
import { useUpdateOrganizationPhoto } from "@/features/portal/hooks/usePortalData";
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
  const { org, isHospitalAdmin } = usePortal();
  const updatePhoto = useUpdateOrganizationPhoto();
  const [previewError, setPreviewError] = useState<string | null>(null);

  const address = [org.address_line1, org.address_line2, org.city, org.state]
    .filter(Boolean)
    .join(", ");

  function choosePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPreviewError(null);
    updatePhoto.mutate(file, {
      onError: (err) =>
        setPreviewError(
          err instanceof Error ? err.message : "Could not save this photo."
        ),
    });
  }

  function removePhoto() {
    setPreviewError(null);
    updatePhoto.mutate(null, {
      onError: (err) =>
        setPreviewError(
          err instanceof Error ? err.message : "Could not remove this photo."
        ),
    });
  }

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
            <Building2 size={16} strokeWidth={1.9} aria-hidden /> Building photo
          </span>
        </div>
        <div className="mc-card-body">
          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {org.building_photo ? (
              <Image
                src={org.building_photo}
                alt={`${org.name}'s building`}
                width={120}
                height={120}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "var(--r-card)",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                className="mc-empty-icon"
                style={{
                  width: 120,
                  height: 120,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={28} strokeWidth={1.9} aria-hidden />
              </div>
            )}

            <div style={{ minWidth: 220, flex: 1 }}>
              <div className="mc-pair-label">Building photo</div>
              <p className="mc-empty-text" style={{ margin: "4px 0 12px" }}>
                {org.building_photo
                  ? "Shown on this hospital's profile."
                  : isHospitalAdmin
                    ? "Add a photo of the hospital or office building."
                    : "Your hospital administrator hasn't added one yet."}
              </p>

              {isHospitalAdmin && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <label
                    className="mc-btn-ghost mc-btn-sm"
                    style={{ cursor: "pointer" }}
                  >
                    {updatePhoto.isPending
                      ? "Uploading…"
                      : org.building_photo
                        ? "Replace photo"
                        : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={choosePhoto}
                      disabled={updatePhoto.isPending}
                      style={{ display: "none" }}
                    />
                  </label>
                  {org.building_photo && (
                    <button
                      type="button"
                      className="mc-btn-ghost mc-btn-sm"
                      onClick={removePhoto}
                      disabled={updatePhoto.isPending}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
              {previewError && (
                <p
                  className="mc-alert mc-alert-error"
                  style={{ marginTop: 10 }}
                >
                  {previewError}
                </p>
              )}
            </div>
          </div>
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

        <div
          className="mc-card-head"
          style={{ borderTop: "1px solid var(--c-border-soft)" }}
        >
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

        <div
          className="mc-card-head"
          style={{ borderTop: "1px solid var(--c-border-soft)" }}
        >
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
