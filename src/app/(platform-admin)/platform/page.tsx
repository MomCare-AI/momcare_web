"use client";

import Link from "next/link";

import { OrgRowItem } from "@/features/platform-admin/components/OrgRowItem";
import { PreviewNotice } from "@/features/platform-admin/components/PreviewNotice";
import { fmtDateTime } from "@/features/platform-admin/components/format";
import { useOverview } from "@/features/platform-admin/hooks/usePlatformAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

export default function PlatformOverviewPage() {
  const { data, isPending } = useOverview();

  const stats = [
    { label: "Hospitals", value: data?.hospitals },
    { label: "NGOs", value: data?.ngos },
    { label: "Pending applications", value: data?.pending },
    { label: "Active organizations", value: data?.activeOrganizations },
  ];

  return (
    <>
      <h1 className="mc-h1">Platform overview</h1>
      <p className="mc-sub" style={{ marginBottom: 18 }}>
        Hospitals and NGOs on MomCare, and what is waiting for a decision.
      </p>
      <PreviewNotice />

      <div className="mc-kpis">
        {stats.map((s) => (
          <div key={s.label} className="mc-kpi">
            <div className="mc-kpi-label">{s.label}</div>
            {s.value === undefined ? (
              <Skeleton className="mt-1 h-7 w-12" aria-hidden />
            ) : (
              <div className="mc-kpi-value">{s.value}</div>
            )}
          </div>
        ))}
      </div>

      <Card style={{ marginBottom: 18 }}>
        <CardHeader>
          <div className="mc-card-title">Recent applications</div>
          <Link href="/platform/applications" className="mc-link">
            View all
          </Link>
        </CardHeader>
        {isPending ? (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={3} variant="plain" />
            </div>
          </CardBody>
        ) : (
          <div className="mc-rows">
            {data?.recentApplications.map((r) => (
              <OrgRowItem key={r.key} row={r} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="mc-card-title">Recent activity</div>
          <Link href="/platform/activity" className="mc-link">
            View all
          </Link>
        </CardHeader>
        {isPending ? (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={2} variant="plain" />
            </div>
          </CardBody>
        ) : data && data.recentActivity.length > 0 ? (
          <div className="mc-rows">
            {data.recentActivity.map((e) => (
              <div key={e.id} className="mc-row">
                <div className="mc-row-main">
                  <div className="mc-row-title">
                    {e.by} {e.action} {e.orgName}
                  </div>
                  <div className="mc-row-meta">{fmtDateTime(e.at)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CardBody>
            <EmptyState
              title="No decisions yet"
              text="Approvals, rejections and suspensions will appear here."
            />
          </CardBody>
        )}
      </Card>
    </>
  );
}
