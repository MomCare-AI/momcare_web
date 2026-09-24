"use client";

import { useState } from "react";
import { AlertTriangle, Power } from "lucide-react";

import { Modal } from "@/shared/ui/Modal";
import {
  useDeactivateLocation,
  useLocationAssignmentStatus,
  useLocations,
  useMoveLocationPatients,
} from "../hooks/useLocations";
import type { Location } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  location: Location;
}

export function DeactivateLocationModal({ open, onClose, location }: Props) {
  const statusQuery = useLocationAssignmentStatus(open ? location.id : null);
  const deactivateLocation = useDeactivateLocation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deactivate location"
      subtitle={location.name}
      icon={<Power size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      {statusQuery.isPending && (
        <p className="mc-hint">Checking active patients at this site…</p>
      )}
      {statusQuery.isSuccess && statusQuery.data.has_active_patients && (
        <>
          <p className="mc-alert mc-alert-notice" style={{ marginBottom: 12 }}>
            <AlertTriangle size={15} strokeWidth={2} aria-hidden />
            {statusQuery.data.message}
          </p>
          <MovePatientsControl locationId={location.id} />
        </>
      )}
      {statusQuery.isSuccess && !statusQuery.data.has_active_patients && (
        <p className="mc-hint">
          No active patients are currently assigned to this location.
        </p>
      )}

      {deactivateLocation.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
          {deactivateLocation.error instanceof Error
            ? deactivateLocation.error.message
            : "Could not deactivate this location."}
        </p>
      )}

      <div
        style={{
          background: "var(--c-teal-wash)",
          margin: "20px -20px -20px",
          padding: "14px 20px",
          borderTop: "1px solid var(--c-border-soft)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          className="mc-btn-ghost"
          style={{ marginLeft: "auto" }}
          onClick={onClose}
          disabled={deactivateLocation.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn"
          style={{ background: "var(--c-high)" }}
          disabled={
            deactivateLocation.isPending ||
            statusQuery.isPending ||
            statusQuery.data?.has_active_patients
          }
          onClick={() =>
            deactivateLocation.mutate(
              { locationId: location.id },
              { onSuccess: onClose }
            )
          }
        >
          {deactivateLocation.isPending
            ? "Deactivating…"
            : "Confirm deactivate"}
        </button>
      </div>
    </Modal>
  );
}

/** The escape hatch for a blocked deactivation — clears the location's
 *  active patients out by moving all of them to another site. Never
 *  triggers deactivation itself; the admin confirms that separately once
 *  this unblocks it. */
function MovePatientsControl({ locationId }: { locationId: string }) {
  const locationsQuery = useLocations();
  const moveLocationPatients = useMoveLocationPatients();
  const [targetId, setTargetId] = useState("");
  const [moved, setMoved] = useState<string | null>(null);

  const targets = (locationsQuery.data?.results ?? []).filter(
    (l) => l.id !== locationId && l.is_active
  );

  if (targets.length === 0) {
    return (
      <p className="mc-hint" style={{ marginBottom: 10 }}>
        There&apos;s no other active location to move these patients to — add
        one first.
      </p>
    );
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select
          className="mc-input"
          value={targetId}
          onChange={(e) => {
            setTargetId(e.target.value);
            setMoved(null);
          }}
        >
          <option value="" disabled>
            Move all patients to…
          </option>
          {targets.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="mc-btn-ghost mc-btn-sm"
          disabled={!targetId || moveLocationPatients.isPending}
          onClick={() =>
            moveLocationPatients.mutate(
              { sourceLocationId: locationId, targetLocationId: targetId },
              {
                onSuccess: (detail) => {
                  setMoved(detail);
                  setTargetId("");
                },
              }
            )
          }
        >
          {moveLocationPatients.isPending ? "Moving…" : "Move patients"}
        </button>
      </div>
      {moved && (
        <p className="mc-alert mc-alert-success" style={{ marginTop: 8 }}>
          {moved}
        </p>
      )}
      {moveLocationPatients.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 8 }}>
          {moveLocationPatients.error instanceof Error
            ? moveLocationPatients.error.message
            : "Could not move these patients."}
        </p>
      )}
    </div>
  );
}
