"use client";

import { useState } from "react";

import { usePortal } from "../layout";
import { ClinicalTagsTab } from "@/features/governance/components/ClinicalTagsTab";
import { GovernanceStatsHeader } from "@/features/governance/components/GovernanceStatsHeader";
import { LocationsTab } from "@/features/governance/components/LocationsTab";
import { NoteTemplatesTab } from "@/features/governance/components/NoteTemplatesTab";
import { SecondaryProvidersTab } from "@/features/governance/components/SecondaryProvidersTab";
import { StaffTab } from "@/features/governance/components/StaffTab";
import { useSecondaryProviders } from "@/features/secondary-providers/hooks/useSecondaryProviders";
import { usePageTitle } from "@/hooks/usePageTitle";

type Tab = "staff" | "locations" | "providers" | "tags" | "notes";

export default function GovernancePage() {
  usePageTitle("System Governance");
  const { org, isHospitalAdmin } = usePortal();
  const [tab, setTab] = useState<Tab>("staff");
  const secondaryProvidersQuery = useSecondaryProviders();

  // Matches the visibility the two separate nav items had before this page
  // existed — "Doctors & Staff" was open to every clinical role, "Hospital"
  // was `adminOnly` (that profile now lives in an edit modal off
  // GovernanceStatsHeader, not a tab — see that component). Merging the nav
  // items into one page must not quietly widen or narrow who can see what,
  // so that split moves here as per-tab gating instead of disappearing.
  //
  // Locations reads open to any hospital staff on the server (a location's
  // own manager needs to see and manage their site without being a hospital
  // admin). Clinical tag curation is admin-only, matching the backend's own
  // write rule — unlike Locations/Secondary Providers, there's no reason for a
  // non-admin to see a page they can't act on here (a tag's presence already
  // surfaces inline while logging a note, for everyone).
  const activeTab =
    !isHospitalAdmin && (tab === "tags" || tab === "notes") ? "staff" : tab;

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">System Governance</h1>
          <p className="mc-sub">
            Your clinical team, hospital record, and sites
          </p>
        </div>
      </div>

      <GovernanceStatsHeader />

      <div className="mc-tabs" role="tablist" aria-label="Governance section">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "staff"}
          aria-current={activeTab === "staff" ? "page" : undefined}
          className="mc-tab"
          onClick={() => setTab("staff")}
        >
          Staff
          <span className="mc-tab-count">{org.staff_count}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "locations"}
          aria-current={activeTab === "locations" ? "page" : undefined}
          className="mc-tab"
          onClick={() => setTab("locations")}
        >
          Locations
          <span className="mc-tab-count">{org.location_count}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "providers"}
          aria-current={activeTab === "providers" ? "page" : undefined}
          className="mc-tab"
          onClick={() => setTab("providers")}
        >
          Secondary Providers
          <span className="mc-tab-count">
            {secondaryProvidersQuery.data?.count ?? 0}
          </span>
        </button>
        {isHospitalAdmin && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "tags"}
            aria-current={activeTab === "tags" ? "page" : undefined}
            className="mc-tab"
            onClick={() => setTab("tags")}
          >
            Clinical Tags
          </button>
        )}
        {isHospitalAdmin && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "notes"}
            aria-current={activeTab === "notes" ? "page" : undefined}
            className="mc-tab"
            onClick={() => setTab("notes")}
          >
            Notes
          </button>
        )}
      </div>

      {activeTab === "staff" && <StaffTab />}
      {activeTab === "locations" && <LocationsTab />}
      {activeTab === "providers" && <SecondaryProvidersTab />}
      {activeTab === "tags" && <ClinicalTagsTab />}
      {activeTab === "notes" && <NoteTemplatesTab />}
    </>
  );
}
