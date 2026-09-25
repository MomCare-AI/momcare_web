"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertCircle,
  BellRing,
  Brain,
  Building2,
  ChevronRight,
  Clock,
  HeartPulse,
  Info,
  MapPin,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { useAlerts } from "@/features/alerts/hooks/useAlerts";
import { useLocationPatients } from "@/features/locations/hooks/useLocations";
import { useLocationScope } from "@/features/locations/LocationScopeContext";
import { RecentAlertsList } from "@/features/reports/components/AlertMetricsPanel";
import { useAllPatients } from "@/features/reports/hooks/useReports";
import { aggregateRiskLevels } from "@/features/reports/lib/aggregate";
import type { RiskDistribution } from "@/features/reports/types";
import {
  useAuditLog,
  type AuditLogEntry,
} from "@/features/portal/hooks/usePortalData";
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
import { Pair } from "@/shared/ui/Pair";
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

/** "READ patients" -> "Read patients". Kept close to the raw log on purpose —
 *  this is an audit trail, not a marketing feed, and paraphrasing it risks
 *  saying something the log itself did not. */
function describeActivity(entry: AuditLogEntry): string {
  const verb =
    entry.action_display ||
    entry.action.charAt(0) + entry.action.slice(1).toLowerCase();
  return entry.resource ? `${verb} ${entry.resource}` : verb;
}

/** A page view is not an "activity" worth reporting back to an admin — the
 *  audit log records it because HIPAA requires every access logged, not
 *  because it's news. Without this, a shift of normal clicking around
 *  buries the handful of entries (enrolled a patient, resolved an alert)
 *  that are actually worth seeing. */
function isNoteworthy(entry: AuditLogEntry): boolean {
  return entry.action !== "READ";
}

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function OverviewPage() {
  usePageTitle("Clinical Overview");
  const { org, isHospitalAdmin, isClinician } = usePortal();
  const router = useRouter();
  const patientsQuery = useAllPatients();
  const liveAlertsQuery = useAlerts("live", false);
  const auditLogQuery = useAuditLog();

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
  const liveAlerts = liveAlertsQuery.data?.results ?? [];
  // Undefined while loading or on error — rendered as "—" rather than 0,
  // because a confident zero we cannot vouch for is the wrong thing to show
  // on a monitoring dashboard.
  const unacknowledged = liveAlertsQuery.isSuccess
    ? liveAlertsQuery.data.unacknowledged
    : undefined;

  const hasStaff = org.staff_count > 0;
  const hasPatients = org.patient_count > 0;

  const risk = useMemo(() => aggregateRiskLevels(patients), [patients]);

  // The server returns every audit-logged action, reads included; the
  // activity feed only wants the ones that changed something.
  const meaningfulActivity = (auditLogQuery.data?.results ?? []).filter(
    isNoteworthy
  );

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
        {/* Leads the stack: this is the one section with a next action
            (open a patient), so it comes before the two that only
            summarize — same reasoning as the KPI reorder above. */}
        <Card className="mc-lift">
          <CardHeader>
            <div className="mc-section-head">
              <span
                className={`mc-section-icon mc-kpi-icon-attn${
                  unacknowledged ? " mc-kpi-icon-alert" : ""
                }`}
              >
                <BellRing size={17} strokeWidth={1.9} aria-hidden />
              </span>
              <div>
                <div className="mc-card-title">Recent live alerts</div>
                <div className="mc-card-sub">
                  Most severe first, unanswered above answered
                </div>
              </div>
            </div>
            {liveAlerts.length > 0 ? (
              <span className="mc-badge mc-badge-neutral">
                {liveAlerts.length}
              </span>
            ) : null}
          </CardHeader>
          {liveAlertsQuery.isError ? (
            <EmptyState
              title="Alerts unavailable"
              text="This is not a statement that nothing is wrong — the list could not be loaded. Refresh to try again."
            />
          ) : liveAlertsQuery.isSuccess && liveAlerts.length === 0 ? (
            <EmptyState
              icon={<BellRing size={20} strokeWidth={1.9} aria-hidden />}
              title="Nothing to review"
              text="No live alerts right now. They appear here the moment a reading crosses a clinical threshold."
            />
          ) : (
            <RecentAlertsList alerts={liveAlerts} />
          )}
        </Card>

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

        {/* A compact banner, not a full card: this is the same static
            sentence for every hospital on every load, so it shouldn't
            carry the same visual weight as sections backed by real,
            per-hospital data. */}
        <div className="mc-ai">
          <span className="mc-ai-tag">
            <Brain size={12} strokeWidth={2.3} aria-hidden />
            AI insight
          </span>
          {/* The model is live and scores every reading as it arrives.
              This card does not yet have an endpoint of its own, so it
              says where the scoring actually is rather than implying a
              summary nobody is computing. */}
          <div style={{ fontSize: 13.5, color: "var(--c-body)" }}>
            The maternal risk model is live and scores every reading as it
            arrives. Each judgement, its confidence and the vitals behind it are
            on the patient&rsquo;s own record; the ones needing a clinician are
            listed under Alerts.
          </div>
          <p className="mc-ai-note">
            AI output is decision support only and is never a diagnosis. A
            clinician reviews every insight before it informs care.
          </p>
        </div>

        {isHospitalAdmin && (
          <Card>
            <CardHeader>
              <div className="mc-section-head">
                <span className="mc-section-icon mc-kpi-icon-neutral">
                  <Clock size={17} strokeWidth={1.9} aria-hidden />
                </span>
                <div>
                  <div className="mc-card-title">Recent activity</div>
                  <div className="mc-card-sub">
                    Who touched patient data, and when
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {auditLogQuery.isSuccess && meaningfulActivity.length === 0 && (
                <div className="mc-hint">No changes recorded yet.</div>
              )}
              {auditLogQuery.isSuccess && meaningfulActivity.length > 0 && (
                <ol className="mc-trail">
                  {meaningfulActivity.map((entry) => (
                    <li key={entry.id} className="mc-trail-item">
                      <span className="mc-trail-dot" aria-hidden />
                      <div>
                        <div className="mc-trail-what">
                          {describeActivity(entry)}
                        </div>
                        <div className="mc-trail-when">
                          <Clock size={11} strokeWidth={2.2} aria-hidden />{" "}
                          {timeAgo(entry.timestamp)}
                          {entry.user_name ? ` · ${entry.user_name}` : ""}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        )}
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

      <Card>
        <CardHeader>
          <div className="mc-section-head">
            <span className="mc-section-icon mc-kpi-icon-brand">
              <Building2 size={17} strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <div className="mc-card-title">Hospital profile</div>
              <div className="mc-card-sub">
                Registration and contact details on file
              </div>
            </div>
          </div>
          <span className="mc-badge mc-badge-neutral">
            <Building2 size={12} strokeWidth={2.2} aria-hidden />
            {org.status_display}
          </span>
        </CardHeader>
        <CardBody>
          <div className="mc-pairs">
            <Pair label="Hospital" value={org.name} />
            <Pair label="Administrator" value={org.owner_name} />
            <Pair label="Licence no." value={org.license_number} />
            <Pair label="Contact email" value={org.email} />
            <Pair label="Phone" value={org.phone} />
            <Pair
              label="Location"
              value={[
                org.address_line1,
                org.address_line2,
                org.city,
                org.state,
                org.country,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            {/* Which population the risk model judges these patients as.
                Derived from the country above, so the two can never disagree.
                Shown because a hospital outside the model's training gets
                clinical rules instead, and should be able to see that. */}
            <Pair label="Risk model region" value={org.region_display} />
          </div>
        </CardBody>
        {hasPatients && (
          <div className="mc-card-foot">
            <Link href="/dashboard/governance" className="mc-link">
              <MapPin size={13} strokeWidth={2} aria-hidden /> View organization
              settings
            </Link>
          </div>
        )}
      </Card>
    </>
  );
}
