"use client";

import { MapPin } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { useLocations } from "@/features/locations/hooks/useLocations";
import { LocationsTable } from "@/features/locations/components/LocationsTable";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

/**
 * The list/table UI is real and ready to go — `LocationsTable` renders
 * actual `Location` rows the moment `GET /api/locations/` exists. It
 * doesn't exist yet (`core/locations/api/views.py` is an unimplemented
 * placeholder), so today this always hits the error branch below. That's
 * the honest, correct behavior for a call to a route that isn't there —
 * not a bug, and not a reason to fake rows in the meantime.
 */
export function LocationsTab() {
  const { org } = usePortal();
  const locationsQuery = useLocations();

  return (
    <>
      <section className="mc-kpis">
        <div className="mc-kpi">
          <div className="mc-kpi-top">
            <span className="mc-kpi-label">Locations</span>
            <span className="mc-kpi-icon mc-kpi-icon-brand">
              <MapPin size={17} strokeWidth={1.9} aria-hidden />
            </span>
          </div>
          <span className="mc-kpi-value">{org.location_count}</span>
          <span className="mc-kpi-foot">Recorded for this hospital</span>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div>
            <div className="mc-card-title">Locations</div>
            <div className="mc-card-sub">Every site this hospital runs</div>
          </div>
        </CardHeader>

        {locationsQuery.isPending && (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={3} variant="plain" />
            </div>
          </CardBody>
        )}

        {locationsQuery.isError && (
          <CardBody>
            <EmptyState
              icon={<MapPin size={20} strokeWidth={1.9} aria-hidden />}
              title="Location management isn't available yet"
              text={`The location data model exists on the backend, but there's no API to list or edit sites yet — that's a real gap, not a connection problem. The count above (${org.location_count}) is the one real figure available today.`}
            />
          </CardBody>
        )}

        {locationsQuery.isSuccess &&
          (locationsQuery.data.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<MapPin size={20} strokeWidth={1.9} aria-hidden />}
                title="No locations recorded"
                text="Sites will appear here once they're added."
              />
            </CardBody>
          ) : (
            <LocationsTable locations={locationsQuery.data} />
          ))}
      </Card>
    </>
  );
}
