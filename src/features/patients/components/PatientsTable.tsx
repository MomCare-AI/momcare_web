"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Users } from "lucide-react";

import { useDevices } from "@/features/monitoring/hooks/useMonitoring";
import { RiskBadge } from "@/features/monitoring/components/RiskBadge";
import { riskLabel } from "@/features/monitoring/types";
import type { Device } from "@/features/monitoring/types";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import {
  FIELDS_WITHOUT_DATA,
  PatientAdvanceFilterModal,
  type FilterRule,
} from "./PatientAdvanceFilterModal";
import {
  pregnancyTone,
  type PatientListItem,
  type PregnancyStatus,
} from "../types";

const PREGNANCY_STATUS_LABELS: Record<PregnancyStatus, string> = {
  active: "Active",
  delivered: "Delivered",
  miscarriage: "Miscarriage",
  termination: "Termination",
  stillbirth: "Stillbirth",
  ended_other: "Ended (other)",
};

/** The human-readable text each filterable field shows in the table today —
 *  matched against, not the raw enum code, so typing what you see (e.g.
 *  "High", "Active") works. Fields in `FIELDS_WITHOUT_DATA` have nothing to
 *  return yet (`/api/patients/` carries no care-team names, language,
 *  reading-day count or last-activity date) — an empty string, which a real
 *  search term will honestly never match, rather than a fabricated value. */
function fieldTextValue(
  patient: PatientListItem,
  field: FilterRule["field"]
): string {
  switch (field) {
    case "full_name":
      return patient.full_name;
    case "risk_level":
      return riskLabel(patient.risk_level);
    case "monitoring_status":
      return patient.pregnancy_status
        ? PREGNANCY_STATUS_LABELS[patient.pregnancy_status]
        : "No pregnancy recorded";
    case "patient_status":
      return patient.is_active ? "Active" : "Inactive";
    default:
      // case_manager / provider / language / reading_days / last_activity
      return "";
  }
}

function matchesRule(patient: PatientListItem, rule: FilterRule): boolean {
  if (FIELDS_WITHOUT_DATA.has(rule.field)) return false;

  const actual = fieldTextValue(patient, rule.field).toLowerCase();
  const typed = rule.value.toLowerCase();

  switch (rule.condition) {
    case "equals":
      return actual === typed;
    case "not_equals":
      return actual !== typed;
    case "contains":
      return actual.includes(typed);
    case "not_contains":
      return !actual.includes(typed);
    case "greater_than":
    case "less_than": {
      const a = Number(actual);
      const t = Number(typed);
      const numeric = !Number.isNaN(a) && !Number.isNaN(t);
      if (rule.condition === "greater_than") {
        return numeric ? a > t : actual > typed;
      }
      return numeric ? a < t : actual < typed;
    }
  }
}

/**
 * The dense, Neuro_RPM-inspired patient table — reuses the `mc-dtable` CSS
 * built for System Governance (Phase 4) rather than the old card-row list.
 * Owns its own search + Advance Filter state, matching how the Governance
 * tables self-contain theirs.
 *
 * Both search and Advance Filters run **client-side** over the `patients`
 * prop, which the caller fetches capped at 100 rows (`page_size=100`, same
 * technique already used for Locations/Staff/Secondary Providers) — honest
 * within that cap, but a hospital with more than 100 patients would need
 * real backend query-param filtering to search/filter its full list. The
 * free-text search box used to be a separate server-side `?search=` request;
 * moved client-side here so it and Advance Filters share one consistent
 * "what you see is the whole filterable set" model instead of two different
 * ones on the same page.
 *
 * Column-by-column honesty: `/api/patients/` (`PatientListSerializer`) has
 * no care-team names, no last-reading date, no last-contact date and no
 * monthly monitoring-time aggregate — those render as "—" on purpose rather
 * than a fabricated value, until a bulk endpoint for them exists. Device is
 * the one addition that's genuinely wireable today: `/api/devices/` already
 * returns `assigned_pregnancy`, which joins straight onto this table's own
 * `pregnancy_id` column, so it's fetched once here and looked up per row.
 *
 * No column is sortable — `/api/patients/` has no `ordering=` param, so a
 * client-side sort would silently only reorder whatever's currently loaded.
 */
export function PatientsTable({
  patients,
  initialSearch = "",
}: {
  patients: PatientListItem[];
  initialSearch?: string;
}) {
  const devicesQuery = useDevices();
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const deviceByPregnancy = useMemo(() => {
    const map = new Map<string, Device>();
    for (const device of devicesQuery.data ?? []) {
      if (device.assigned_pregnancy) map.set(device.assigned_pregnancy, device);
    }
    return map;
  }, [devicesQuery.data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesSearch =
        !q ||
        [p.full_name, p.mrn, p.phone, p.cnic]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesFilters = filters.every((rule) => matchesRule(p, rule));
      return matchesSearch && matchesFilters;
    });
  }, [patients, search, filters]);

  return (
    <>
      <div
        style={{
          padding: "14px 20px 0",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", maxWidth: 340, flex: "1 1 260px" }}>
          <Search
            size={14}
            strokeWidth={2}
            aria-hidden
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.5,
            }}
          />
          <input
            className="mc-input"
            style={{ paddingLeft: 30 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, CNIC or MRN"
            aria-label="Search patients"
          />
        </div>
        <button
          type="button"
          className="mc-btn-ghost mc-btn-sm"
          onClick={() => setShowFilterModal(true)}
        >
          <SlidersHorizontal size={13} strokeWidth={2} aria-hidden />
          Advance Filters
          {filters.length > 0 && (
            <span className="mc-tab-count">{filters.length}</span>
          )}
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users size={20} strokeWidth={1.9} aria-hidden />}
          title="No matching patients"
          text="Try a different search term or adjust your filters."
        />
      ) : (
        <div className="mc-dtable-wrap" style={{ marginTop: 14 }}>
          <table className="mc-dtable">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Status</th>
                <th>Gestational age</th>
                <th>Care Manager</th>
                <th>Provider</th>
                <th>Last Reading</th>
                <th>Last Call</th>
                <th>Monitoring Time</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((patient) => {
                const device = patient.pregnancy_id
                  ? deviceByPregnancy.get(patient.pregnancy_id)
                  : undefined;

                return (
                  <tr key={patient.id} className="mc-dtable-row">
                    <td>
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          color: "inherit",
                          textDecoration: "none",
                        }}
                      >
                        <InitialsAvatar name={patient.full_name} size={30} />
                        <div>
                          <div className="mc-dtable-primary">
                            {patient.full_name}
                          </div>
                          <div className="mc-dtable-sub">
                            {[patient.mrn, patient.phone, patient.cnic]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td>
                      {patient.pregnancy_status === "active" ? (
                        <RiskBadge level={patient.risk_level} />
                      ) : patient.pregnancy_status ? (
                        <span
                          className={`mc-badge mc-badge-${pregnancyTone(patient.pregnancy_status)}`}
                        >
                          No active pregnancy
                        </span>
                      ) : (
                        <span className="mc-badge mc-badge-neutral">
                          No pregnancy recorded
                        </span>
                      )}
                    </td>
                    <td>{patient.gestational_age_display || "—"}</td>
                    <td className="mc-dtable-sub">—</td>
                    <td className="mc-dtable-sub">—</td>
                    <td className="mc-dtable-sub">—</td>
                    <td className="mc-dtable-sub">—</td>
                    <td className="mc-dtable-sub">—</td>
                    <td>
                      {device ? (
                        <span className="mc-badge mc-badge-neutral">
                          {device.serial_number}
                        </span>
                      ) : (
                        <span className="mc-dtable-sub">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PatientAdvanceFilterModal
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        activeFilters={filters}
        onApply={setFilters}
      />
    </>
  );
}
