"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Users } from "lucide-react";

import { useDevices } from "@/features/monitoring/hooks/useMonitoring";
import { RiskBadge } from "@/features/monitoring/components/RiskBadge";
import { riskLabel } from "@/features/monitoring/types";
import type { Device } from "@/features/monitoring/types";
import { EmptyState } from "@/shared/ui/EmptyState";
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
 * Column-by-column honesty: care-team names, last-reading, last-contact and
 * monthly monitoring-time all come straight off `/api/patients/`
 * (`PatientListSerializer`'s enrichment fields) and render "—" only when
 * that field is genuinely null (nobody assigned, no reading yet) — never a
 * fabricated value. Device is the one column not on that serializer:
 * `/api/devices/` returns `assigned_pregnancy`, which joins straight onto
 * this table's own `pregnancy_id` column, so it's fetched once here and
 * looked up per row.
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
  const router = useRouter();
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
      <div className="mc-table-toolbar">
        <div className="mc-table-toolbar-search">
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
                <th>Language</th>
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
                  <tr
                    key={patient.id}
                    className="mc-dtable-row"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      // Let the name cell's own <a> handle its click
                      // natively (new-tab/middle-click/copy-link all keep
                      // working) — the row-wide handler only covers every
                      // other cell, which has nothing clickable of its own.
                      if ((e.target as HTMLElement).closest("a, button"))
                        return;
                      router.push(`/dashboard/patients/${patient.id}`);
                    }}
                  >
                    <td>
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="mc-dtable-primary"
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {patient.full_name}
                      </Link>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
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
                        {patient.statuses.map((s) => (
                          <span
                            key={s.name}
                            title={s.description || undefined}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "2px 9px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 600,
                              color: s.color,
                              background: `${s.color}1a`,
                              border: `1px solid ${s.color}55`,
                            }}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{patient.gestational_age_display || "—"}</td>
                    <td className="mc-dtable-sub">
                      {patient.care_manager_name || "—"}
                    </td>
                    <td className="mc-dtable-sub">
                      {patient.provider_name || "—"}
                    </td>
                    <td className="mc-dtable-sub">{patient.language || "—"}</td>
                    <td className="mc-dtable-sub">
                      {patient.last_reading_display || "—"}
                    </td>
                    <td className="mc-dtable-sub">
                      {patient.last_monitoring_contact_display || "—"}
                    </td>
                    <td className="mc-dtable-sub">
                      {patient.monitoring_time_display || "—"}
                    </td>
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
