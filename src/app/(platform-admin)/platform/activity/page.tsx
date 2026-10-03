"use client";

import { PreviewNotice } from "@/features/platform-admin/components/PreviewNotice";
import { TypeChip } from "@/features/platform-admin/components/StatusBadge";
import { fmtDateTime } from "@/features/platform-admin/components/format";
import { useActivity } from "@/features/platform-admin/hooks/usePlatformAdmin";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

export default function ActivityPage() {
  const { data, isPending } = useActivity();

  return (
    <>
      <h1 className="mc-h1">Activity</h1>
      <p className="mc-sub" style={{ marginBottom: 18 }}>
        Every decision made on an application or organization: who, what, when
        and why.
      </p>
      <PreviewNotice />

      <Card>
        {isPending ? (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={4} variant="plain" />
            </div>
          </CardBody>
        ) : data && data.length > 0 ? (
          <div className="mc-rows">
            {data.map((e) => (
              <div key={e.id} className="mc-row">
                <div className="mc-row-main">
                  <div
                    className="mc-row-title"
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {e.by} {e.action} {e.orgName}
                    <TypeChip type={e.type} />
                  </div>
                  <div className="mc-row-meta">
                    {fmtDateTime(e.at)}
                    {e.note && <> · {e.note}</>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CardBody>
            <EmptyState
              title="No decisions yet"
              text="Approvals, rejections and suspensions will be listed here."
            />
          </CardBody>
        )}
      </Card>
    </>
  );
}
