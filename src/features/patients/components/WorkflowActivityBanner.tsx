"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gauge,
  Timer,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { AlertBell } from "@/features/alerts/components/AlertBell";
import type { DashboardKpis } from "../types";

type ListTab = "patients" | "requests";

interface TileContentProps {
  label: string;
  value?: number;
  icon: React.ReactNode;
  selected: boolean;
}

interface Props {
  activeTab: ListTab;
  onSelect: (tab: ListTab) => void;
  requestsCount: number;
  /** From GET /api/patients/dashboard-kpis/ — undefined while loading or on
   *  error, in which case every tile below shows "—" rather than a
   *  fabricated 0. */
  totalPatients?: number;
  activePatients?: number;
  inactivePatients?: number;
  workflow?: DashboardKpis["workflow"];
  careActivities?: DashboardKpis["care_activities"];
  /** Which server-side `?workflow=`/`?care_activity=` filter (if any) the
   *  patients list is currently showing — highlights the matching tile the
   *  same way the tab strip highlights `activeTab`. */
  activeWorkflowFilter?: string | null;
  activeCareActivityFilter?: string | null;
}

function tileClassName(selected: boolean): string {
  return selected ? "mc-kpi-tile mc-kpi-tile-selected" : "mc-kpi-tile";
}

function TileContent({ label, value, icon, selected }: TileContentProps) {
  return (
    <>
      <span
        className={selected ? "mc-kpi-icon mc-kpi-icon-brand" : "mc-kpi-icon"}
      >
        {icon}
      </span>
      <span>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: value === undefined ? "var(--c-faint)" : "var(--c-ink)",
            lineHeight: 1,
          }}
        >
          {value ?? "—"}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--c-faint)", marginTop: 3 }}>
          {label}
        </div>
      </span>
    </>
  );
}

const SCROLL_STEP = 150;

function SectionHeader({
  children,
  brand,
  rowRef,
}: {
  children: React.ReactNode;
  brand?: boolean;
  rowRef: React.RefObject<HTMLDivElement | null>;
}) {
  const scrollBy = (delta: number) =>
    rowRef.current?.scrollBy({ left: delta, behavior: "smooth" });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: brand ? "var(--c-teal)" : "var(--c-faint)",
        }}
      >
        {children}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          aria-label="Scroll left"
          className="mc-kpi-scroll-btn"
          onClick={() => scrollBy(-SCROLL_STEP)}
        >
          <ChevronLeft size={13} strokeWidth={2.2} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          className="mc-kpi-scroll-btn"
          onClick={() => scrollBy(SCROLL_STEP)}
        >
          <ChevronRight size={13} strokeWidth={2.2} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/**
 * The dashboard's full KPI surface, restyled from the reference platform's
 * own layout — all backed by GET /api/patients/dashboard-kpis/, MomCare's
 * equivalent of the same endpoint. Two rows:
 *
 * 1. Patient roster split — Active/Inactive only — sits above the tinted
 *    Workflow/Care Activity box as its own plain row, matching the
 *    reference's own separate top boxes rather than living inside it.
 * 2. Workflow / Care Activity — "All Patients" (total_patients) is the
 *    reset-to-default tile (clears any `?workflow=`/`?care_activity=`
 *    filter) and leads the Workflow row; Risk Review and Low Confidence
 *    (`workflow.*`) are real links to `/dashboard?workflow=...`; every
 *    Care Activity tile links to `/dashboard?care_activity=...`. All three
 *    filter the patients list server-side, via the identical condition
 *    the KPI count itself was computed with, so a tile's number can never
 *    disagree with what you see after clicking it. Join Requests is
 *    unrelated to dashboard-kpis and stays a local tab switch, unchanged.
 *    There is deliberately no Worklist tile here — MomCare's Worklist is a
 *    separate administrative-gaps concept (see
 *    docs/worklist-feature-scope.md), not one of the reference's KPIs.
 */
export function WorkflowActivityBanner({
  activeTab,
  onSelect,
  requestsCount,
  totalPatients,
  activePatients,
  inactivePatients,
  workflow,
  careActivities,
  activeWorkflowFilter,
  activeCareActivityFilter,
}: Props) {
  const showingDefault =
    activeTab === "patients" &&
    !activeWorkflowFilter &&
    !activeCareActivityFilter;
  const workflowRowRef = useRef<HTMLDivElement>(null);
  const careActivityRowRef = useRef<HTMLDivElement>(null);

  const careActivityTiles: {
    filter: "monitoring_follow_up" | "unseen_readings" | "reading_reminder";
    label: string;
    value?: number;
    icon: React.ReactNode;
  }[] = [
    {
      filter: "monitoring_follow_up",
      label: "Monitoring Follow-up",
      value: careActivities?.monitoring_follow_up,
      icon: <Timer size={16} strokeWidth={1.9} aria-hidden />,
    },
    {
      filter: "unseen_readings",
      label: "Unseen Readings",
      value: careActivities?.unseen_readings,
      icon: <Eye size={16} strokeWidth={1.9} aria-hidden />,
    },
    {
      filter: "reading_reminder",
      label: "Reading Reminder",
      value: careActivities?.reading_reminder,
      icon: <Bell size={16} strokeWidth={1.9} aria-hidden />,
    },
  ];

  return (
    <>
      {/* ── Patient roster split ─────────────────────────────── */}
      <div className="mc-kpi-roster-row">
        <div
          style={{
            flex: "0 1 20%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <AlertBell />
        </div>
        <div
          className="mc-kpi-tile"
          style={{ cursor: "default", flex: "1 1 40%" }}
        >
          <TileContent
            label="Active Patients"
            value={activePatients}
            icon={<Users size={16} strokeWidth={1.9} aria-hidden />}
            selected={false}
          />
        </div>
        <div
          className="mc-kpi-tile"
          style={{ cursor: "default", flex: "1 1 40%" }}
        >
          <TileContent
            label="Inactive Patients"
            value={inactivePatients}
            icon={<UserMinus size={16} strokeWidth={1.9} aria-hidden />}
            selected={false}
          />
        </div>
      </div>

      <div className="mc-hero" style={{ padding: "18px 20px" }}>
        <div className="mc-kpi-columns">
          <div className="mc-kpi-column">
            <SectionHeader brand rowRef={workflowRowRef}>
              Workflow
            </SectionHeader>
            <div className="mc-kpi-row" ref={workflowRowRef}>
              <Link
                href="/dashboard"
                onClick={() => onSelect("patients")}
                className={tileClassName(showingDefault)}
              >
                <TileContent
                  label="All Patients"
                  value={totalPatients}
                  icon={<Users size={16} strokeWidth={1.9} aria-hidden />}
                  selected={showingDefault}
                />
              </Link>

              <Link
                href="/dashboard?workflow=risk_review"
                className={tileClassName(
                  activeWorkflowFilter === "risk_review"
                )}
              >
                <TileContent
                  label="Risk Review"
                  value={workflow?.risk_review}
                  icon={
                    <AlertTriangle size={16} strokeWidth={1.9} aria-hidden />
                  }
                  selected={activeWorkflowFilter === "risk_review"}
                />
              </Link>

              <Link
                href="/dashboard?workflow=low_confidence"
                className={tileClassName(
                  activeWorkflowFilter === "low_confidence"
                )}
              >
                <TileContent
                  label="Low Confidence"
                  value={workflow?.low_confidence}
                  icon={<Gauge size={16} strokeWidth={1.9} aria-hidden />}
                  selected={activeWorkflowFilter === "low_confidence"}
                />
              </Link>

              {/* A real link to the bare URL, same as "All Patients" —
                  not a plain state-only button. Join Requests has nothing
                  to do with `?workflow=`/`?care_activity=`, but a button
                  that only changed local tab state left a stale filter
                  param in the URL, so Low Confidence (or any other filter
                  tile) stayed highlighted at the same time as this one. */}
              <Link
                href="/dashboard"
                onClick={() => onSelect("requests")}
                aria-selected={activeTab === "requests"}
                role="tab"
                className={tileClassName(activeTab === "requests")}
              >
                <TileContent
                  label="Join Requests"
                  value={requestsCount}
                  icon={<UserCheck size={16} strokeWidth={1.9} aria-hidden />}
                  selected={activeTab === "requests"}
                />
              </Link>
            </div>
          </div>

          <div className="mc-kpi-column">
            <SectionHeader rowRef={careActivityRowRef}>
              Care Activity
            </SectionHeader>
            <div className="mc-kpi-row" ref={careActivityRowRef}>
              {careActivityTiles.map((t) => (
                <Link
                  key={t.filter}
                  href={`/dashboard?care_activity=${t.filter}`}
                  className={tileClassName(
                    activeCareActivityFilter === t.filter
                  )}
                >
                  <TileContent
                    label={t.label}
                    value={t.value}
                    icon={t.icon}
                    selected={activeCareActivityFilter === t.filter}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
