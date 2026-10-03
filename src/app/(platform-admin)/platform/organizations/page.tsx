"use client";

import { OrgRowItem } from "@/features/platform-admin/components/OrgRowItem";
import { PreviewNotice } from "@/features/platform-admin/components/PreviewNotice";
import { useOrganizations } from "@/features/platform-admin/hooks/usePlatformAdmin";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

export default function OrganizationsPage() {
  const { data, isPending, isError } = useOrganizations();

  return (
    <>
      <h1 className="mc-h1">Organizations</h1>
      <p className="mc-sub" style={{ marginBottom: 18 }}>
        Hospitals and NGOs that have been approved. Open one to suspend or
        reactivate it.
      </p>
      <PreviewNotice />

      <Card>
        {isPending ? (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={4} variant="plain" />
            </div>
          </CardBody>
        ) : isError ? (
          <CardBody>
            <EmptyState
              title="Could not load organizations"
              text="Try again in a moment."
            />
          </CardBody>
        ) : data.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No approved organizations yet"
              text="Approve an application and it will appear here."
            />
          </CardBody>
        ) : (
          <div className="mc-rows">
            {data.map((r) => (
              <OrgRowItem key={r.key} row={r} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
