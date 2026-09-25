"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, UserCheck, UserX } from "lucide-react";

import { usePatientList } from "@/features/patients/hooks/usePatients";
import { RiskBadge } from "@/features/monitoring/components/RiskBadge";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { useDebouncedValue } from "../useDebouncedValue";

// DefaultPagination caps page_size at 100 server-side — the same limit
// Reports already relies on to pull "the whole hospital" in one page. The
// Active/Inactive breakdown below is computed from whatever this call
// returns, so on a hospital with more than 100 patients it undercounts;
// `total` itself stays exact regardless, since it reads the paginated
// envelope's own `count`, not the fetched row count.
const STATS_PAGE_SIZE = 100;

export function PatientLookupTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const statsQuery = usePatientList("", 1, false, STATS_PAGE_SIZE);
  const searchQuery = usePatientList(debouncedSearch.trim(), 1, false, 50);

  const total = statsQuery.data?.count ?? 0;
  const statsRows = statsQuery.data?.results ?? [];
  const activeCount = statsRows.filter((p) => p.is_active).length;
  const inactiveCount = statsRows.filter((p) => !p.is_active).length;
  const statsCapped = total > statsRows.length;

  const rows = searchQuery.data?.results ?? [];
  const searching = debouncedSearch.trim().length > 0;

  return (
    <>
      <section className="mc-kpis">
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Total Patients</span>
            <span className="mc-kpi-icon mc-kpi-icon-brand">
              <User size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{total}</span>
          <span className="mc-kpi-foot">Across all locations</span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Active Patients</span>
            <span
              className="mc-kpi-icon"
              style={{
                background: "var(--c-stable-soft)",
                color: "var(--c-stable-text)",
              }}
            >
              <UserCheck size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{activeCount}</span>
          <span className="mc-kpi-foot">
            {statsCapped
              ? `Of the first ${statsRows.length} fetched`
              : "Across all locations"}
          </span>
        </div>
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Inactive Patients</span>
            <span
              className="mc-kpi-icon"
              style={{
                background: "var(--c-moderate-soft)",
                color: "var(--c-moderate-text)",
              }}
            >
              <UserX size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{inactiveCount}</span>
          <span className="mc-kpi-foot">
            {statsCapped
              ? `Of the first ${statsRows.length} fetched`
              : "Across all locations"}
          </span>
        </div>
      </section>

      <div className="mc-card">
        <div className="mc-card-head">
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span className="mc-kpi-icon mc-kpi-icon-brand" aria-hidden>
              <Search size={17} strokeWidth={1.9} />
            </span>
            <div>
              <div className="mc-card-title">Find a patient</div>
              <div className="mc-card-sub">Search by name, MRN, or phone.</div>
            </div>
          </div>
        </div>
        <div className="mc-card-body">
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              strokeWidth={2}
              aria-hidden
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.5,
              }}
            />
            <input
              className="mc-input"
              style={{ paddingLeft: 38, background: "var(--c-ground)" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Ayesha Bibi, MRN-10234, 0300…"
              aria-label="Search patients"
            />
          </div>
        </div>
      </div>

      {!searching && (
        <EmptyState
          icon={<Search size={22} strokeWidth={1.7} aria-hidden />}
          title="Start typing to search for a patient"
          text="Search by name, MRN, or phone to look up a patient."
        />
      )}

      {searching && searchQuery.isPending && (
        <div className="mc-rows" style={{ marginTop: 14 }}>
          <RowSkeleton count={4} variant="plain" />
        </div>
      )}

      {searching && searchQuery.isError && (
        <EmptyState
          title="Couldn't search patients"
          text="This is a problem reaching the server, not an empty result. Try again."
        />
      )}

      {searching && searchQuery.isSuccess && rows.length === 0 && (
        <EmptyState
          icon={<Search size={22} strokeWidth={1.7} aria-hidden />}
          title="No patients match"
          text="Try a different name, MRN, or phone number."
        />
      )}

      {searching && searchQuery.isSuccess && rows.length > 0 && (
        <div className="mc-dtable-wrap" style={{ marginTop: 14 }}>
          <table className="mc-dtable">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>MRN</th>
                <th>Status</th>
                <th>Location</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="mc-dtable-row">
                  <td>
                    <Link
                      href={`/dashboard/patients/${p.id}`}
                      className="mc-dtable-primary"
                      style={{ color: "var(--c-teal)" }}
                    >
                      {p.full_name}
                    </Link>
                    {p.risk_level && (
                      <div style={{ marginTop: 4 }}>
                        <RiskBadge level={p.risk_level} />
                      </div>
                    )}
                  </td>
                  <td>{p.mrn || "—"}</td>
                  <td>
                    {p.is_active ? (
                      <span className="mc-badge mc-badge-stable">Active</span>
                    ) : (
                      <span className="mc-badge mc-badge-neutral">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td
                    className="mc-dtable-sub"
                    title="Not yet available — the patient list endpoint doesn't return a location on this row yet"
                  >
                    —
                  </td>
                  <td
                    className="mc-dtable-sub"
                    title="Not yet available — no email field exists on a patient record"
                  >
                    —
                  </td>
                  <td>{p.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
