"use client";

import { useState } from "react";
import { Pencil, Power, UserCheck } from "lucide-react";

import { ActionMenu, ActionMenuItem } from "@/shared/ui/ActionMenu";
import { useReactivateLocation } from "../hooks/useLocations";
import type { Location } from "../types";
import { DeactivateLocationModal } from "./DeactivateLocationModal";
import { EditLocationModal } from "./EditLocationModal";

interface Props {
  location: Location;
  isHospitalAdmin: boolean;
}

/** The trailing Action column — a 3-dot menu (Edit / Deactivate or
 *  Reactivate), matching the reference platform's own table and the same
 *  pattern already used for Staff, replacing the old row-expand-to-edit
 *  behavior. Reactivate is hospital_admin only, same as the backend. */
export function LocationActionMenu({ location, isHospitalAdmin }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const reactivateLocation = useReactivateLocation();

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <ActionMenu label="Location actions">
        <ActionMenuItem
          icon={<Pencil size={13} strokeWidth={2} aria-hidden />}
          label="Edit"
          onClick={() => setShowEdit(true)}
        />
        {location.is_active ? (
          <ActionMenuItem
            icon={<Power size={13} strokeWidth={2} aria-hidden />}
            label="Deactivate"
            danger
            onClick={() => setShowDeactivate(true)}
          />
        ) : (
          isHospitalAdmin && (
            <ActionMenuItem
              icon={<UserCheck size={13} strokeWidth={2} aria-hidden />}
              label={
                reactivateLocation.isPending ? "Reactivating…" : "Reactivate"
              }
              disabled={reactivateLocation.isPending}
              onClick={() => reactivateLocation.mutate(location.id)}
            />
          )
        )}
      </ActionMenu>

      <EditLocationModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        location={location}
      />
      <DeactivateLocationModal
        open={showDeactivate}
        onClose={() => setShowDeactivate(false)}
        location={location}
      />
    </div>
  );
}
