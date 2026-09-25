"use client";

import { useState } from "react";
import { Clock, FileText, Plus } from "lucide-react";

import { usePatientMonitoring } from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { LogSessionModal } from "./LogSessionModal";

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  patientId: string;
  patientLocationName?: string;
  onOpenNotes: () => void;
}

/**
 * "Recent Notes" and "Monitoring Sessions" — split into two cards matching
 * the reference platform's own Overview layout, both reading the same
 * combined `usePatientMonitoring` timeline MomCare already fetches (see
 * backend CLAUDE.md's `core/monitoring` row: MomCare deliberately merges
 * sessions and notes into one model pair, unlike the reference's split).
 * "Add" and "View all" jump to the existing Notes tab rather than
 * duplicating its full create/edit/delete form here a second time — one
 * real place to log a contact, not two copies to keep in sync.
 * A single combined monthly total is shown, not an RPM/CCM split — MomCare
 * runs one programme, so there is nothing to split.
 */
export function RecentActivityCards({
  patientId,
  patientLocationName,
  onOpenNotes,
}: Props) {
  const monitoringQuery = usePatientMonitoring(patientId);
  const entries = monitoringQuery.data?.results ?? [];
  const notes = entries.filter((e) => e.note).slice(0, 5);
  const sessions = entries.filter((e) => e.session).slice(0, 5);
  const totalFormatted = monitoringQuery.data?.totals.total_formatted;
  const [showLogModal, setShowLogModal] = useState(false);

  return (
    <div className="mc-grid-even">
      <Card>
        <CardHeader>
          <div>
            <div className="mc-card-title">
              <FileText
                size={15}
                strokeWidth={1.9}
                style={{ verticalAlign: -2, marginRight: 6 }}
                aria-hidden
              />
              Recent Notes
            </div>
            <div className="mc-card-sub">
              {monitoringQuery.isPending
                ? "…"
                : `${notes.length} note${notes.length === 1 ? "" : "s"} this month`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="mc-btn-ghost mc-btn-sm"
              onClick={() => setShowLogModal(true)}
            >
              <Plus size={13} strokeWidth={2} aria-hidden />
              Add Note
            </button>
            <button className="mc-btn-ghost mc-btn-sm" onClick={onOpenNotes}>
              View All
            </button>
          </div>
        </CardHeader>
        <CardBody>
          {monitoringQuery.isPending ? (
            <div className="mc-hint">Loading…</div>
          ) : notes.length === 0 ? (
            <div className="mc-hint">No notes logged yet this month.</div>
          ) : (
            <div className="mc-rows">
              {notes.map((entry, i) => (
                <div key={i} className="mc-row" style={{ padding: "10px 0" }}>
                  <div className="mc-row-main">
                    <div className="mc-row-title">
                      {entry.note!.added_by_name}
                    </div>
                    <div className="mc-row-meta">{entry.note!.note}</div>
                    <div className="mc-row-meta" style={{ marginTop: 2 }}>
                      {timeAgo(entry.recorded_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <div className="mc-card-title">
              <Clock
                size={15}
                strokeWidth={1.9}
                style={{ verticalAlign: -2, marginRight: 6 }}
                aria-hidden
              />
              Monitoring Sessions
            </div>
            <div className="mc-card-sub">
              {monitoringQuery.isPending
                ? "…"
                : `${sessions.length} session${sessions.length === 1 ? "" : "s"} this month`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="mc-btn-ghost mc-btn-sm"
              onClick={() => setShowLogModal(true)}
            >
              <Plus size={13} strokeWidth={2} aria-hidden />
              Add Session
            </button>
            <button className="mc-btn-ghost mc-btn-sm" onClick={onOpenNotes}>
              View All
            </button>
          </div>
        </CardHeader>
        <CardBody>
          {totalFormatted && (
            <div
              className="mc-card"
              style={{
                padding: "10px 14px",
                marginBottom: 12,
                background: "var(--c-teal-wash)",
              }}
            >
              <div className="mc-pair-label">Total this month</div>
              <div className="mc-pair-value">{totalFormatted}</div>
            </div>
          )}
          {monitoringQuery.isPending ? (
            <div className="mc-hint">Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="mc-hint">No sessions logged yet this month.</div>
          ) : (
            <div className="mc-rows">
              {sessions.map((entry, i) => {
                const mins = Math.round(entry.session!.duration_seconds / 60);
                return (
                  <div key={i} className="mc-row" style={{ padding: "10px 0" }}>
                    <div className="mc-row-main">
                      <div className="mc-row-title">
                        {entry.session!.added_by_name}
                      </div>
                      <div className="mc-row-meta">
                        {mins < 1 ? "under a minute" : `${mins} min`}
                      </div>
                      <div className="mc-row-meta" style={{ marginTop: 2 }}>
                        {timeAgo(entry.recorded_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <LogSessionModal
        patientId={patientId}
        patientLocationName={patientLocationName}
        open={showLogModal}
        onClose={() => setShowLogModal(false)}
      />
    </div>
  );
}
