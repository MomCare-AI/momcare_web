"use client";

import { useState } from "react";
import { Briefcase, Search, Watch } from "lucide-react";

import { DeviceLookupTab } from "@/features/lookup/components/DeviceLookupTab";
import { PatientLookupTab } from "@/features/lookup/components/PatientLookupTab";
import { StaffLookupTab } from "@/features/lookup/components/StaffLookupTab";
import { usePageTitle } from "@/hooks/usePageTitle";

type Tab = "patients" | "devices" | "staff";

const TABS: { key: Tab; label: string; Icon: typeof Search }[] = [
  { key: "patients", label: "Search Patients", Icon: Search },
  { key: "devices", label: "Device Look Up", Icon: Watch },
  { key: "staff", label: "Staff", Icon: Briefcase },
];

/**
 * Find a patient across every location, look up a device by its serial
 * number, or find a staff member — without leaving this page. Reuses the
 * same list data every other screen already fetches (patients, devices,
 * staff); no new endpoints.
 */
export default function QuickLookupPage() {
  usePageTitle("Quick Lookup");
  const [tab, setTab] = useState<Tab>("patients");

  return (
    <>
      <h1 className="mc-h1">Quick Look Up</h1>
      <p className="mc-sub" style={{ marginBottom: 18 }}>
        Find a patient across every location, look up a device by its serial
        number, or find a staff member — without leaving this page.
      </p>

      <div className="mc-tabs" role="tablist" aria-label="Look up">
        {TABS.map(({ key, label, Icon }) => {
          const active = key === tab;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              className="mc-tab"
              onClick={() => setTab(key)}
            >
              <Icon
                size={14}
                strokeWidth={2}
                aria-hidden
                style={{ marginRight: 6, verticalAlign: -2 }}
              />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "patients" && <PatientLookupTab />}
      {tab === "devices" && <DeviceLookupTab />}
      {tab === "staff" && <StaffLookupTab />}
    </>
  );
}
