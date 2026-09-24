"use client";

import { MapPin } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { useLocations } from "@/features/locations/hooks/useLocations";
import { LocationsTable } from "@/features/locations/components/LocationsTable";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

export function LocationsTab() {
  const { org } = usePortal();
  const locationsQuery = useLocations();
  const locations = locationsQuery.data?.results ?? [];

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
              title="Couldn't load locations"
              text="This is a problem reaching the server, not an empty hospital. Refresh to try again."
            />
          </CardBody>
        )}

        {locationsQuery.isSuccess &&
          (locations.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<MapPin size={20} strokeWidth={1.9} aria-hidden />}
                title="No locations recorded"
                text="Sites will appear here once they're added."
              />
            </CardBody>
          ) : (
            <LocationsTable locations={locations} />
          ))}
      </Card>
    </>
  );
}
