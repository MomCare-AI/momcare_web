"use client";

import { useState } from "react";

import { usePortal } from "../layout";
import { GovernanceStatsHeader } from "@/features/governance/components/GovernanceStatsHeader";
import { LocationsTab } from "@/features/governance/components/LocationsTab";
import { NoteTemplatesTab } from "@/features/governance/components/NoteTemplatesTab";
import { SecondaryProvidersTab } from "@/features/governance/components/SecondaryProvidersTab";
import { StaffTab } from "@/features/governance/components/StaffTab";
import { StatusLabelsTab } from "@/features/governance/components/StatusLabelsTab";
import { useSecondaryProviders } from "@/features/secondary-providers/hooks/useSecondaryProviders";
import { usePageTitle } from "@/hooks/usePageTitle";

type Tab = "staff" | "locations" | "providers" | "statuses" | "notes";

export default function GovernancePage() {
  usePageTitle("System Governance");
  const { org, isHospitalAdmin } = usePortal();
  const [tab, setTab] = useState<Tab>("locations");
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
  // admin). Status curation is admin-only, matching the backend's own write
  // rule — unlike Locations/Secondary Providers, there's no reason for a
  // non-admin to see a page they can't act on here. Clinical tag curation
  // was dropped from here entirely (see below) — Statuses now covers that
  // admin-curation role, and ad-hoc tag creation while logging a note still
  // works unchanged (`ClinicalTag`'s own inline get-or-create, untouched).
  const activeTab =
    !isHospitalAdmin && (tab === "statuses" || tab === "notes")
      ? "locations"
      : tab;

  return (
    <>
      <GovernanceStatsHeader />

      <div className="mc-tabs" role="tablist" aria-label="Governance section">
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
            aria-selected={activeTab === "statuses"}
            aria-current={activeTab === "statuses" ? "page" : undefined}
            className="mc-tab"
            onClick={() => setTab("statuses")}
          >
            Statuses
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
      {activeTab === "statuses" && <StatusLabelsTab />}
      {activeTab === "notes" && <NoteTemplatesTab />}
    </>
  );
}
