"use client";

import { useState } from "react";

import { usePortal } from "../layout";
import { HospitalTab } from "@/features/governance/components/HospitalTab";
import { LocationsTab } from "@/features/governance/components/LocationsTab";
import { StaffTab } from "@/features/governance/components/StaffTab";
import { usePageTitle } from "@/hooks/usePageTitle";

type Tab = "staff" | "hospital" | "locations";

export default function GovernancePage() {
  usePageTitle("System Governance");
  const { isHospitalAdmin } = usePortal();
  const [tab, setTab] = useState<Tab>("staff");

  // Matches the visibility the two separate nav items had before this page
  // existed — "Doctors & Staff" was open to every clinical role, "Hospital"
  // was `adminOnly`. Merging them into one nav entry must not quietly widen
  // or narrow who can see what, so that split moves here as per-tab gating
  // instead of disappearing.
  const activeTab = !isHospitalAdmin && tab !== "staff" ? "staff" : tab;

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
        </button>
        {isHospitalAdmin && (
          <>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "hospital"}
              aria-current={activeTab === "hospital" ? "page" : undefined}
              className="mc-tab"
              onClick={() => setTab("hospital")}
            >
              Hospital
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
            </button>
          </>
        )}
      </div>

      {activeTab === "staff" && <StaffTab />}
      {activeTab === "hospital" && <HospitalTab />}
      {activeTab === "locations" && <LocationsTab />}
    </>
  );
}
