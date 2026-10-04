"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight, Search, ShieldAlert } from "lucide-react";

import { SessionExpiredError } from "@/core/api/authFetch";
import { useLocationScope } from "@/features/locations/LocationScopeContext";
import { RiskBadge } from "@/features/monitoring/components/RiskBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientsTableSkeleton } from "@/features/patients/components/PatientsTableSkeleton";
import {
  useDashboardKpis,
  usePatientList,
} from "@/features/patients/hooks/usePatients";
import type { PatientWorkflowFilter } from "@/features/patients/types";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { formatGestationalAge } from "@/shared/lib/gestation";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";

import {
  BUCKET_LABEL,
  BUCKETS,
  countByBucket,
  filterPatients,
  sortByRisk,
  type RiskBucket,
} from "../riskView";

type View = "all" | PatientWorkflowFilter;

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Never";

/**
 * Every patient's current risk, highest first. The queues that need a
 * clinician (assessments waiting for review, low model confidence) are one
 * click away as tabs; opening a patient goes to her own Risk panel, where
 * the review and escalate actions live.
 */
export function RiskOverview({ assignedToMe }: { assignedToMe: boolean }) {
  const { selectedLocationId } = useLocationScope();
  const [view, setView] = useState<View>("all");
  const [bucket, setBucket] = useState<RiskBucket | "all">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);

  // The same counts the Overview tiles show, for the same site.
  const kpis = useDashboardKpis(selectedLocationId);
  const list = usePatientList(
    "",
    1,
    assignedToMe,
    100,
    view === "all" ? undefined : view,
    undefined,
    // A different tab or site is a different list: show the skeleton, never
    // the previous one's patients.
    { keepPreviousData: false, location: selectedLocationId }
  );

  const patients = useMemo(() => list.data?.results ?? [], [list.data]);
  const counts = useMemo(() => countByBucket(patients), [patients]);
  const rows = useMemo(
    () =>
      sortByRisk(filterPatients(patients, { bucket, search: debouncedSearch })),
    [patients, bucket, debouncedSearch]
  );

  const tabs: { value: View; label: string; count?: number }[] = [
    { value: "all", label: "All patients" },
    {
      value: "risk_review",
      label: "Needs review",
      count: kpis.data?.workflow.risk_review,
    },
    {
      value: "low_confidence",
      label: "Low confidence",
      count: kpis.data?.workflow.low_confidence,
    },
  ];

  const filtered = bucket !== "all" || search.trim() !== "";
  const sessionExpired = list.error instanceof SessionExpiredError;

  return (
    <>
      <h1 className="mc-h1">Risk</h1>
      <p className="mc-sub" style={{ marginBottom: 18 }}>
        Each patient&rsquo;s current risk level, highest first. Open a patient
        to review or escalate an assessment.
      </p>

      <div className="mc-tabs" role="tablist" aria-label="Risk view">
        {tabs.map((t) => {
          const selected = view === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={selected}
              className="mc-tab"
              style={
                selected
                  ? {
                      color: "var(--c-ink)",
                      fontWeight: 700,
                      boxShadow: "inset 0 -2px 0 var(--c-teal)",
                    }
                  : undefined
              }
              onClick={() => {
                setView(t.value);
                setBucket("all");
              }}
            >
              {t.label}
              {t.count !== undefined ? (
                <span className="mc-tab-count">{t.count}</span>
              ) : (
                t.value !== "all" && (
                  <Skeleton
                    aria-hidden
                    className="ml-1.5 inline-block h-4 w-5 align-middle"
                  />
                )
              )}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "stretch",
          marginBottom: 16,
        }}
      >
        {BUCKETS.map((b) => {
          const active = bucket === b;
          return (
            <button
              key={b}
              type="button"
              aria-pressed={active}
              onClick={() => setBucket(active ? "all" : b)}
              className={`mc-kpi-tile${active ? " mc-kpi-tile-selected" : ""}`}
            >
              <span>
                <span className="mc-kpi-value" style={{ fontSize: 20 }}>
                  {list.isPending ? (
                    <Skeleton
                      aria-hidden
                      className="inline-block h-5 w-6 align-middle"
                    />
                  ) : (
                    counts[b]
                  )}
                </span>
                <span className="mc-kpi-label" style={{ display: "block" }}>
                  {BUCKET_LABEL[b]}
                </span>
              </span>
            </button>
          );
        })}

        <div
          style={{
            position: "relative",
            flex: "1 1 220px",
            maxWidth: 320,
            marginLeft: "auto",
            alignSelf: "center",
          }}
        >
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
            type="search"
            placeholder="Search by name or MRN"
            aria-label="Search patients"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {list.isPending ? (
          <PatientsTableSkeleton />
        ) : list.isError && !sessionExpired ? (
          <CardBody>
            <p className="mc-alert mc-alert-error">
              <AlertCircle size={15} strokeWidth={2} aria-hidden />
              {list.error instanceof Error
                ? list.error.message
                : "Could not load patients."}
            </p>
          </CardBody>
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<ShieldAlert size={20} strokeWidth={1.9} aria-hidden />}
              title={
                filtered
                  ? "No patients match"
                  : view === "all"
                    ? "No patients yet"
                    : "Nothing waiting here"
              }
              text={
                filtered
                  ? "Try a different risk level or clear the search."
                  : view === "all"
                    ? "Patients appear here once they are enrolled."
                    : "This is a current result: no assessment in this queue needs attention right now."
              }
              actions={
                filtered ? (
                  <button
                    type="button"
                    className="mc-btn-ghost"
                    onClick={() => {
                      setBucket("all");
                      setSearch("");
                    }}
                  >
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          </CardBody>
        ) : (
          <div className="mc-dtable-wrap">
            <table className="mc-dtable">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Risk</th>
                  <th>Waiting for review</th>
                  <th>Gestational age</th>
                  <th>Last assessed</th>
                  <th>Provider</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="mc-dtable-row">
                    <td>
                      <Link
                        href={`/dashboard/patients/${p.id}`}
                        className="mc-dtable-primary"
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {p.full_name}
                      </Link>
                      {p.mrn && <div className="mc-dtable-sub">{p.mrn}</div>}
                    </td>
                    <td>
                      <RiskBadge
                        level={p.risk_level}
                        unacknowledged={p.pending_risk_count > 0}
                      />
                    </td>
                    <td>
                      {p.pending_risk_count > 0 ? (
                        <span className="mc-badge mc-badge-medium">
                          {p.pending_risk_count} pending
                        </span>
                      ) : (
                        "—"
                      )}
                      {p.needs_low_confidence_review && (
                        <div className="mc-dtable-sub">Low confidence</div>
                      )}
                    </td>
                    <td>
                      {formatGestationalAge(
                        p.gestational_age_display,
                        p.gestational_age_long_display
                      )}
                    </td>
                    <td className="mc-dtable-sub">
                      {fmtDate(p.risk_assessed_at)}
                    </td>
                    <td className="mc-dtable-sub">{p.provider_name || "—"}</td>
                    <td>
                      <Link
                        href={`/dashboard/patients/${p.id}`}
                        aria-label={`Open ${p.full_name}`}
                        className="mc-btn-ghost mc-btn-sm"
                      >
                        <ChevronRight size={14} aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
