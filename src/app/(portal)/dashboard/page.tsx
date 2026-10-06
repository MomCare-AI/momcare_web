"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Info, Stethoscope, UserPlus, Users } from "lucide-react";
import { useLocationScope } from "@/features/locations/LocationScopeContext";
import { SessionExpiredError } from "@/core/api/authFetch";
import { useJoinRequests } from "@/features/join-requests/hooks/useJoinRequests";
import { JoinRequestsPanel } from "@/features/patients/components/JoinRequestsPanel";
import { PatientsTable } from "@/features/patients/components/PatientsTable";
import { PatientsTableSkeleton } from "@/features/patients/components/PatientsTableSkeleton";
import { WorkflowActivityBanner } from "@/features/patients/components/WorkflowActivityBanner";
import type {
  PatientCareActivityFilter,
  PatientWorkflowFilter,
} from "@/features/patients/types";
import {
  useDashboardKpis,
  usePatientList,
} from "@/features/patients/hooks/usePatients";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { usePortal } from "./portal";
import { usePageTitle } from "@/hooks/usePageTitle";

const WORKFLOW_FILTER_LABELS: Record<PatientWorkflowFilter, string> = {
  risk_review: "Risk Review",
  low_confidence: "Low Confidence",
};
const CARE_ACTIVITY_FILTER_LABELS: Record<PatientCareActivityFilter, string> = {
  monitoring_follow_up: "Monitoring Follow-up",
  unseen_readings: "Unseen Readings",
  reading_reminder: "Reading Reminder",
};

function isWorkflowFilter(
  value: string | null
): value is PatientWorkflowFilter {
  return value === "risk_review" || value === "low_confidence";
}
function isCareActivityFilter(
  value: string | null
): value is PatientCareActivityFilter {
  return (
    value === "monitoring_follow_up" ||
    value === "unseen_readings" ||
    value === "reading_reminder"
  );
}

export default function OverviewPage() {
  usePageTitle("Clinical Overview");
  const { org, isHospitalAdmin, isClinician } = usePortal();
  const router = useRouter();

  // Folded in from the old standalone Patients page — Patients / Join
  // Requests tabs, unchanged hooks and panels. Worklist's own tile was
  // dropped from the KPI banner (not one of the reference platform's
  // dashboard-kpis concepts), which left this tab with no way to reach it.
  const assignedToMe = isClinician && !isHospitalAdmin;
  const [listTab, setListTab] = useState<"patients" | "requests">("patients");
  const joinRequests = useJoinRequests("pending");
  // The sidebar's location switcher: null is "All Locations". Every count
  // on this page and the list itself follow it, so a site shows its own
  // numbers rather than the whole hospital's.
  const { selectedLocationId } = useLocationScope();
  const dashboardKpis = useDashboardKpis(selectedLocationId);

  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const workflowFilterParam = searchParams.get("workflow");
  const careActivityFilterParam = searchParams.get("care_activity");
  const workflowFilter = isWorkflowFilter(workflowFilterParam)
    ? workflowFilterParam
    : undefined;
  const careActivityFilter = isCareActivityFilter(careActivityFilterParam)
    ? careActivityFilterParam
    : undefined;

  // A Workflow/Care Activity KPI tile links to this same page with a query
  // param rather than switching local state directly — real, shareable
  // URLs, per the tiles' own job of being links. Arriving with one always
  // means "show the (now filtered) patients tab", even if some other tab
  // was showing before this navigation (client-side nav to the same route
  // doesn't remount the page, so `listTab`'s own initial value wouldn't
  // otherwise change).
  useEffect(() => {
    if (workflowFilter || careActivityFilter) setListTab("patients");
  }, [workflowFilter, careActivityFilter]);

  // page_size=100: the whole hospital's list fetched once, so Search and
  // Advance Filters (both client-side, in PatientsTable) share one
  // consistent in-memory set — see that component's own doc comment for the
  // honest tradeoff at hospitals with more than 100 patients. The
  // workflow/care-activity filter, unlike search, is applied server-side —
  // matching exactly what dashboard-kpis counted.
  const listResult = usePatientList(
    "",
    1,
    assignedToMe,
    100,
    workflowFilter,
    careActivityFilter,
    // Each KPI tile (and each location) is a different list, so switching
    // shows the skeleton rather than the previous one's patients.
    { keepPreviousData: false, location: selectedLocationId }
  );

  // `?location=` combines with the workflow and care-activity filters on the
  // same endpoint, so a site's list and its tile counts always agree. (The
  // per-location sub-resource endpoint cannot take those filters, which is
  // why this page used to fall back to the whole hospital whenever a tile
  // was selected.)
  const scopedToLocation = selectedLocationId !== null;
  const activeResult = listResult;

  useEffect(() => {
    if (listResult.error instanceof SessionExpiredError)
      router.replace("/login?expired=1");
  }, [listResult.error, router]);

  const listPatients = activeResult.data?.results ?? [];
  // The current query's own result count — the filtered subset while a
  // workflow/care-activity filter is applied, the full roster otherwise.
  const listCount = activeResult.data?.count ?? 0;

  const hasStaff = org.staff_count > 0;

  // Only used to word the empty state; the tile itself shows the active filter.
  const activeFilterLabel = workflowFilter
    ? WORKFLOW_FILTER_LABELS[workflowFilter]
    : careActivityFilter
      ? CARE_ACTIVITY_FILTER_LABELS[careActivityFilter]
      : null;

  return (
    <>
      <WorkflowActivityBanner
        activeTab={listTab}
        onSelect={setListTab}
        // Always the true, unfiltered roster total — dashboard-kpis' own
        // count, not the currently-filtered list's.
        totalPatients={dashboardKpis.data?.total_patients ?? listCount}
        requestsCount={
          dashboardKpis.data?.pending_join_requests ??
          joinRequests.data?.count ??
          0
        }
        activePatients={dashboardKpis.data?.active_patients}
        inactivePatients={dashboardKpis.data?.inactive_patients}
        workflow={dashboardKpis.data?.workflow}
        careActivities={dashboardKpis.data?.care_activities}
        activeWorkflowFilter={workflowFilter}
        activeCareActivityFilter={careActivityFilter}
      />

      {isHospitalAdmin && (
        <div className="mc-actions">
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
      ) : activeResult.isPending ? (
        <Card style={{ marginBottom: 18 }}>
          <PatientsTableSkeleton />
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
                    activeFilterLabel
                      ? `No patients need ${activeFilterLabel.toLowerCase()}`
                      : scopedToLocation
                        ? "No patients at this location"
                        : "No patients enrolled yet"
                  }
                  text={
                    activeFilterLabel
                      ? "This is a real, current result — nobody in the roster matches this filter right now, not a loading or error state."
                      : scopedToLocation
                        ? "Switch locations, or clear the filter to see the whole hospital."
                        : "Enrol your first patient to start tracking her pregnancy."
                  }
                  actions={
                    !scopedToLocation &&
                    !activeFilterLabel && (
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
                canEnrol={isHospitalAdmin}
              />
            )}
          </Card>
        </>
      )}

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
