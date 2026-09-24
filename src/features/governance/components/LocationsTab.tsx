"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { useStaffList } from "@/features/staff/hooks/useStaff";
import { useLocations } from "@/features/locations/hooks/useLocations";
import { LocationsTable } from "@/features/locations/components/LocationsTable";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { CreateLocationModal } from "./CreateLocationModal";

const MANAGER_ROLE_CODES = new Set([
  "hospital_admin",
  "provider",
  "nurse",
  "care_manager",
]);

export function LocationsTab() {
  const { isHospitalAdmin } = usePortal();
  const locationsQuery = useLocations();
  const staffQuery = useStaffList();

  const [showForm, setShowForm] = useState(false);

  const locations = locationsQuery.data?.results ?? [];
  const managers = (staffQuery.data ?? []).filter((m) =>
    MANAGER_ROLE_CODES.has(m.role_code)
  );

  return (
    <>
      <Card>
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

        {locationsQuery.isSuccess && (
          <LocationsTable
            locations={locations}
            canAddLocation={isHospitalAdmin}
            onAddLocation={() => setShowForm(true)}
          />
        )}
      </Card>

      {isHospitalAdmin && (
        <CreateLocationModal
          open={showForm}
          onClose={() => setShowForm(false)}
          managers={managers}
        />
      )}
    </>
  );
}
