"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Watch } from "lucide-react";

import {
  useAssignDevice,
  useDevices,
  useUnassignDevice,
} from "@/features/monitoring/hooks/useMonitoring";
import { ACQUISITION_OPTIONS } from "@/features/monitoring/types";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pair } from "@/shared/ui/Pair";

interface Props {
  pregnancyId: string;
  canWrite: boolean;
}

/**
 * Device assignment for one pregnancy — `useDevices`/`useAssignDevice`/
 * `useUnassignDevice` already existed, fully wired to real endpoints, with
 * no component anywhere calling them until this panel (checked directly:
 * a repo-wide search turned up zero usages). Not a new backend capability,
 * just the first UI surface for one that already shipped.
 */
export function PatientDevicesPanel({ pregnancyId, canWrite }: Props) {
  const devicesQuery = useDevices();
  const assign = useAssignDevice(pregnancyId);
  const unassign = useUnassignDevice(pregnancyId);
  const [deviceId, setDeviceId] = useState("");
  const [acquisition, setAcquisition] = useState("");

  const devices = devicesQuery.data ?? [];
  const assigned = useMemo(
    () => devices.find((d) => d.assigned_pregnancy === pregnancyId),
    [devices, pregnancyId]
  );
  const available = useMemo(
    () => devices.filter((d) => !d.is_assigned),
    [devices]
  );

  const submitAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId) return;
    assign.mutate(
      { deviceId, acquisition },
      { onSuccess: () => setDeviceId("") }
    );
  };

  if (devicesQuery.isPending) {
    return (
      <Card>
        <CardBody>Loading devices…</CardBody>
      </Card>
    );
  }

  if (devicesQuery.isError) {
    return (
      <Card>
        <EmptyState
          title="Devices unavailable"
          text="This is not a statement that no device is assigned — the list could not be loaded. Refresh to try again."
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="mc-card-title">Device</div>
          <div className="mc-card-sub">
            The monitoring band this pregnancy currently wears
          </div>
        </div>
      </CardHeader>

      {assigned ? (
        <CardBody>
          <div className="mc-pairs" style={{ marginBottom: 18 }}>
            <Pair label="Serial number" value={assigned.serial_number} />
            <Pair label="Status" value={assigned.status_display} />
            <Pair
              label="Acquisition"
              value={assigned.acquisition_display || "—"}
            />
            <Pair
              label="Assigned"
              value={
                assigned.assigned_at
                  ? new Date(assigned.assigned_at).toLocaleDateString()
                  : "—"
              }
            />
          </div>
          {canWrite && (
            <>
              {unassign.isError && (
                <p
                  className="mc-alert mc-alert-error"
                  style={{ marginBottom: 12 }}
                >
                  <AlertTriangle size={14} strokeWidth={2} aria-hidden />
                  {unassign.error instanceof Error
                    ? unassign.error.message
                    : "Could not return this device."}
                </p>
              )}
              <button
                type="button"
                className="mc-btn-ghost mc-btn-sm"
                disabled={unassign.isPending}
                onClick={() => unassign.mutate()}
              >
                {unassign.isPending ? "Returning…" : "Unassign device"}
              </button>
            </>
          )}
        </CardBody>
      ) : available.length === 0 ? (
        <CardBody>
          <EmptyState
            icon={<Watch size={20} strokeWidth={1.9} aria-hidden />}
            title="No device assigned"
            text="No unassigned devices are in stock at this hospital either — register one from the Devices page first."
          />
        </CardBody>
      ) : !canWrite ? (
        <CardBody>
          <EmptyState
            icon={<Watch size={20} strokeWidth={1.9} aria-hidden />}
            title="No device assigned"
          />
        </CardBody>
      ) : (
        <CardBody>
          <form onSubmit={submitAssign}>
            <div className="mc-formgrid">
              <div>
                <label className="mc-label" htmlFor="device-select">
                  Device <span className="mc-req">*</span>
                </label>
                <select
                  id="device-select"
                  className="mc-input"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  required
                >
                  <option value="">Select an unassigned device…</option>
                  {available.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.serial_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mc-label" htmlFor="device-acquisition">
                  Acquisition
                </label>
                <select
                  id="device-acquisition"
                  className="mc-input"
                  value={acquisition}
                  onChange={(e) => setAcquisition(e.target.value)}
                >
                  <option value="">Not specified</option>
                  {ACQUISITION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {assign.isError && (
              <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
                <AlertTriangle size={14} strokeWidth={2} aria-hidden />
                {assign.error instanceof Error
                  ? assign.error.message
                  : "Could not assign this device."}
              </p>
            )}

            <button
              type="submit"
              className="mc-btn"
              style={{ marginTop: 14 }}
              disabled={assign.isPending}
            >
              <Watch size={15} strokeWidth={2} aria-hidden />
              {assign.isPending ? "Assigning…" : "Assign device"}
            </button>
          </form>
        </CardBody>
      )}
    </Card>
  );
}
