"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertCircle,
  ChevronRight,
  HeartPulse,
  Info,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { useLocationPatients } from "@/features/locations/hooks/useLocations";
import { useLocationScope } from "@/features/locations/LocationScopeContext";
import { useAllPatients } from "@/features/reports/hooks/useReports";
import { aggregateRiskLevels } from "@/features/reports/lib/aggregate";
import type { RiskDistribution } from "@/features/reports/types";
import { SessionExpiredError } from "@/core/api/authFetch";
import { useJoinRequests } from "@/features/join-requests/hooks/useJoinRequests";
import { JoinRequestsPanel } from "@/features/patients/components/JoinRequestsPanel";
import { PatientsTable } from "@/features/patients/components/PatientsTable";
import { WorkflowActivityBanner } from "@/features/patients/components/WorkflowActivityBanner";
import { WorklistPanel } from "@/features/patients/components/WorklistPanel";
import {
  usePatientList,
  useWorklist,
} from "@/features/patients/hooks/usePatients";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { usePortal } from "./layout";
import { usePageTitle } from "@/hooks/usePageTitle";

const RISK_LEVELS: {
  key: keyof Pick<RiskDistribution, "high" | "medium" | "low" | "not_assessed">;
  label: string;
  badge: string;
  color: string;
}[] = [
  {
    key: "high",
    label: "High",
    badge: "mc-badge-high",
    color: "var(--c-high)",
  },
  {
    key: "medium",
    label: "Medium",
    badge: "mc-badge-medium",
    color: "var(--c-moderate)",
  },
  {
    key: "low",
    label: "Low",
    badge: "mc-badge-low",
    color: "var(--c-stable)",
  },
  {
    key: "not_assessed",
    label: "Not assessed",
    badge: "mc-badge-neutral",
    color: "var(--c-faint)",
  },
];

/** CSS conic-gradient stops for the risk donut — no charting library needed
 *  for five static segments, and it stays crisp at any size. */
function donutGradient(risk: RiskDistribution): string {
  const total = risk.total || 1;
  let cursor = 0;
  const stops = RISK_LEVELS.map(({ key, color }) => {
    const pct = (risk[key] / total) * 100;
    const from = cursor;
    cursor += pct;
    return `${color} ${from}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function OverviewPage() {
  usePageTitle("Clinical Overview");
  const { org, isHospitalAdmin, isClinician } = usePortal();
  const router = useRouter();
  const patientsQuery = useAllPatients();

  // Folded in from the old standalone Patients page — same three tabs
  // (Patients / Worklist / Join Requests), unchanged hooks and panels.
  const assignedToMe = isClinician && !isHospitalAdmin;
  const [listTab, setListTab] = useState<"patients" | "worklist" | "requests">(
    "patients"
  );
  const worklist = useWorklist(assignedToMe);
  const joinRequests = useJoinRequests("pending");

  const initialSearch = useSearchParams().get("search") ?? "";
  // page_size=100: the whole hospital's list fetched once, so Search and
  // Advance Filters (both client-side, in PatientsTable) share one
  // consistent in-memory set — see that component's own doc comment for the
  // honest tradeoff at hospitals with more than 100 patients.
  const listResult = usePatientList("", 1, assignedToMe, 100);

  // The sidebar's location switcher — "All Locations" (null) uses the
  // hospital-wide query above; a specific site swaps in its own
  // sub-resource endpoint (`/api/locations/<id>/patients/`), the only
  // place a per-location patient list actually exists server-side today.
  const { selectedLocationId } = useLocationScope();
  const locationResult = useLocationPatients(selectedLocationId);
  const scopedToLocation = selectedLocationId !== null;
  const activeResult = scopedToLocation ? locationResult : listResult;

  useEffect(() => {
    if (listResult.error instanceof SessionExpiredError)
      router.replace("/login");
  }, [listResult.error, router]);

  const listPatients = activeResult.data?.results ?? [];
  const listCount = activeResult.data?.count ?? 0;

  const patients = patientsQuery.data ?? [];

  const hasStaff = org.staff_count > 0;

  const risk = useMemo(() => aggregateRiskLevels(patients), [patients]);

  return (
    <>
      <WorkflowActivityBanner
        activeTab={listTab}
        onSelect={setListTab}
        patientsCount={listCount}
        worklistCount={worklist.data?.count ?? 0}
        requestsCount={joinRequests.data?.count ?? 0}
      />

      {isHospitalAdmin && (
        <div className="mc-actions">
          <Link href="/dashboard/patients/new" className="mc-btn">
            <UserPlus size={15} strokeWidth={2} aria-hidden />
            Enrol patient
          </Link>
          <span className="mc-badge mc-badge-neutral">
            <Info size={12} strokeWidth={2.2} aria-hidden />
            Vitals, risk scoring and alert escalation are all live
          </span>
        </div>
      )}

      {listTab === "requests" ? (
        <Card style={{ marginBottom: 18 }}>
          <CardBody>
            <JoinRequestsPanel />
          </CardBody>
        </Card>
      ) : listTab === "worklist" ? (
        <Card style={{ marginBottom: 18 }}>
          <CardBody>
            <p className="mc-hint" style={{ marginBottom: 14 }}>
              Cases missing a recent reading, a recent note, an answered risk
              history, or a lead clinician — not a statement about clinical
              severity. See Needing attention for that.
            </p>
            <WorklistPanel assignedToMe={assignedToMe} />
          </CardBody>
        </Card>
      ) : activeResult.isPending ? (
        <Card style={{ marginBottom: 18 }}>
          <div className="mc-rows">
            <RowSkeleton count={4} variant="plain" />
          </div>
        </Card>
      ) : (
        <>
          {activeResult.error &&
            !(activeResult.error instanceof SessionExpiredError) && (
              <p className="mc-alert mc-alert-error">
                <AlertCircle size={15} strokeWidth={2} aria-hidden />
                {activeResult.error instanceof Error
                  ? activeResult.error.message
                  : "Could not load patients."}
              </p>
            )}

          <Card style={{ marginBottom: 18 }}>
            {listPatients.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={<Users size={20} strokeWidth={1.9} aria-hidden />}
                  title={
                    scopedToLocation
                      ? "No patients at this location"
                      : "No patients enrolled yet"
                  }
                  text={
                    scopedToLocation
                      ? "Switch locations, or clear the filter to see the whole hospital."
                      : "Enrol your first patient to start tracking her pregnancy."
                  }
                  actions={
                    !scopedToLocation && (
                      <Link href="/dashboard/patients/new" className="mc-btn">
                        <UserPlus size={15} strokeWidth={2} aria-hidden />
                        Enrol patient
                      </Link>
                    )
                  }
                />
              </CardBody>
            ) : (
              <PatientsTable
                patients={listPatients}
                initialSearch={initialSearch}
              />
            )}
          </Card>
        </>
      )}

      <div className="mc-fullstack">
        <Card>
          <CardHeader>
            <div className="mc-section-head">
              <span className="mc-section-icon mc-kpi-icon-brand">
                <HeartPulse size={17} strokeWidth={1.9} aria-hidden />
              </span>
              <div>
                <div className="mc-card-title">Maternal health overview</div>
                <div className="mc-card-sub">
                  Active pregnancies by current risk level
                </div>
              </div>
            </div>
          </CardHeader>

          {patientsQuery.isError && (
            <EmptyState
              title="Overview unavailable"
              text="This is not a statement that no patient needs review — the list could not be loaded. Refresh to try again."
            />
          )}

          {patientsQuery.isSuccess && risk.total === 0 && (
            <EmptyState
              icon={<HeartPulse size={20} strokeWidth={1.9} aria-hidden />}
              title="No health data yet"
              text="A breakdown by risk level will appear here once patients are enrolled and their readings begin arriving."
            />
          )}

          {patientsQuery.isSuccess && risk.total > 0 && (
            <CardBody>
              <div className="mc-donut-wrap">
                <motion.div
                  className="mc-donut"
                  style={{ background: donutGradient(risk) }}
                  role="img"
                  aria-label={`${risk.total} active pregnancies, ${risk.needing_attention} needing review`}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mc-donut-hole">
                    <span className="mc-donut-value">{risk.total}</span>
                    <span className="mc-donut-label">active pregnancies</span>
                  </div>
                </motion.div>
                <div className="mc-riskbars">
                  {RISK_LEVELS.map(({ key, label, color }, index) => {
                    const count = risk[key];
                    const pct =
                      risk.total > 0
                        ? Math.round((count / risk.total) * 100)
                        : 0;
                    return (
                      <div key={key} className="mc-riskbar-row">
                        <span className="mc-riskbar-tag">
                          <span
                            className="mc-riskbar-dot"
                            style={{ background: color }}
                            aria-hidden
                          />
                          {label}
                        </span>
                        <div className="mc-riskbar-track">
                          <motion.div
                            className="mc-riskbar-fill"
                            style={{ background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              duration: 0.5,
                              delay: 0.1 + index * 0.08,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                          />
                        </div>
                        <span className="mc-riskbar-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mc-hint" style={{ marginTop: 14 }}>
                {risk.needing_attention} of {risk.total} active{" "}
                {risk.total === 1 ? "pregnancy needs" : "pregnancies need"}{" "}
                review right now.
              </div>

              {risk.needing_attention > 0 && (
                <Link
                  href="/dashboard/alerts"
                  className="mc-link"
                  style={{ marginTop: 12 }}
                >
                  View alerts
                  <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                </Link>
              )}
            </CardBody>
          )}
        </Card>
      </div>

      {!hasStaff && isHospitalAdmin && (
        <Card style={{ marginBottom: 18 }}>
          <EmptyState
            icon={<Stethoscope size={20} strokeWidth={1.9} aria-hidden />}
            title="No doctors yet"
            text="Your clinical team hasn't been added. Add doctors, nurses and care managers to start running your hospital on MomCare."
            actions={
              <Link href="/dashboard/governance" className="mc-btn">
                <UserPlus size={15} strokeWidth={2} aria-hidden />
                Add staff
              </Link>
            }
          />
        </Card>
      )}
    </>
  );
}
