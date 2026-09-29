"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";

import { useStatusLabels } from "@/features/statuses/hooks/useStatuses";
import {
  useAddPatientStatus,
  usePatientStatuses,
  useRemovePatientStatus,
} from "@/features/patients/hooks/usePatients";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";

const DEFAULT_COLOR = "#4361ee";

interface Props {
  patientId: string;
  canWrite: boolean;
}

/**
 * Assigning/removing a status on a patient — `PatientStatus` and its full
 * CRUD endpoint already existed (core/monitoring), but nothing in the
 * portal ever called it: the Statuses catalogue (governance) only manages
 * which names/colors a hospital can pick from, it never assigns one to a
 * patient. This is that missing assignment surface.
 *
 * Picking from the catalogue copies that entry's name/description/color
 * into a new, independent `PatientStatus` row — editing or deleting the
 * catalogue entry later never changes a status already logged here, same
 * as the backend model's own stated behaviour.
 */
export function PatientStatusesPanel({ patientId, canWrite }: Props) {
  const statusesQuery = usePatientStatuses(patientId);
  const labelsQuery = useStatusLabels();
  const addStatus = useAddPatientStatus(patientId);
  const removeStatus = useRemovePatientStatus(patientId);
  const [labelId, setLabelId] = useState("");

  const statuses = statusesQuery.data ?? [];
  const labels = labelsQuery.data?.results ?? [];

  const assign = () => {
    const label = labels.find((l) => l.id === labelId);
    if (!label) return;
    addStatus.mutate(
      {
        name: label.name,
        description: label.description,
        color: label.color ?? DEFAULT_COLOR,
      },
      { onSuccess: () => setLabelId("") }
    );
  };

  return (
    <Card style={{ marginTop: 18 }}>
      <CardHeader>
        <div className="mc-card-title">Statuses</div>
        <div className="mc-card-sub">
          Custom statuses logged against this patient, from your hospital's own
          catalogue.
        </div>
      </CardHeader>
      <CardBody>
        {statusesQuery.isPending ? (
          <p className="mc-hint">Loading…</p>
        ) : statuses.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={18} strokeWidth={1.9} aria-hidden />}
            title="No statuses logged"
            text="Nothing has been assigned to this patient yet."
          />
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {statuses.map((s) => (
              <span
                key={s.id}
                title={s.description || undefined}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 6px 4px 12px",
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: s.color,
                  background: `${s.color}1a`,
                  border: `1px solid ${s.color}55`,
                }}
              >
                {s.name}
                {canWrite && (
                  <button
                    type="button"
                    aria-label={`Remove ${s.name}`}
                    onClick={() => removeStatus.mutate(s.id)}
                    disabled={removeStatus.isPending}
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: "none",
                      background: "transparent",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <X size={12} strokeWidth={2.4} aria-hidden />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {removeStatus.isError && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
            {removeStatus.error instanceof Error
              ? removeStatus.error.message
              : "Could not remove this status."}
          </p>
        )}

        {canWrite && (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <select
              className="mc-input"
              style={{ maxWidth: 260 }}
              value={labelId}
              onChange={(e) => setLabelId(e.target.value)}
              disabled={labels.length === 0}
              aria-label="Status to assign"
            >
              <option value="">
                {labels.length === 0
                  ? "No statuses defined for this hospital"
                  : "Choose a status…"}
              </option>
              {labels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="mc-btn mc-btn-sm"
              disabled={!labelId || addStatus.isPending}
              onClick={assign}
            >
              {addStatus.isPending ? "Assigning…" : "Assign"}
            </button>
          </div>
        )}

        {addStatus.isError && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
            {addStatus.error instanceof Error
              ? addStatus.error.message
              : "Could not assign this status."}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
