"use client";

import { useState } from "react";
import { Clock, FileText, Pencil, Plus, Trash2 } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { usePatientMonitoring } from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import { NoteDeleteModal } from "@/features/monitoring-notes/components/NoteDeleteModal";
import { NoteEditModal } from "@/features/monitoring-notes/components/NoteEditModal";
import { SessionDeleteModal } from "@/features/monitoring-notes/components/SessionDeleteModal";
import { SessionEditModal } from "@/features/monitoring-notes/components/SessionEditModal";
import type {
  MonitoringNote,
  MonitoringSession,
} from "@/features/monitoring-notes/types";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { TintedIconButton } from "@/shared/ui/TintedIconButton";
import { LogSessionModal } from "./LogSessionModal";

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
  const { user, isHospitalAdmin } = usePortal();
  const monitoringQuery = usePatientMonitoring(patientId);
  const entries = monitoringQuery.data?.results ?? [];
  const notes = entries.filter((e) => e.note).slice(0, 5);
  const sessions = entries.filter((e) => e.session).slice(0, 5);
  const totalFormatted = monitoringQuery.data?.totals.total_formatted;
  const [showLogModal, setShowLogModal] = useState(false);

  const canEdit = (addedById: string) =>
    isHospitalAdmin || addedById === user.id;

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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: 300,
                overflowY: "auto",
              }}
            >
              {notes.map((entry, i) => (
                <NoteCard
                  key={i}
                  patientId={patientId}
                  note={entry.note!}
                  canEdit={canEdit(entry.note!.added_by)}
                />
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxHeight: 300,
                overflowY: "auto",
              }}
            >
              {sessions.map((entry, i) => (
                <SessionCard
                  key={i}
                  patientId={patientId}
                  session={entry.session!}
                  canEdit={canEdit(entry.session!.added_by)}
                />
              ))}
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

function NoteCard({
  patientId,
  note,
  canEdit,
}: {
  patientId: string;
  note: MonitoringNote;
  canEdit: boolean;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className="mc-card"
      style={{
        padding: "10px 12px",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--c-border-soft)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
        >
          <InitialsAvatar name={note.added_by_name || "?"} size={26} />
          <div style={{ minWidth: 0 }}>
            <div className="mc-row-title" style={{ fontSize: 13.5 }}>
              {note.added_by_name}
            </div>
            <div
              className="mc-row-meta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
              }}
            >
              <Clock size={10} strokeWidth={2.2} aria-hidden />
              {formatDateTime(note.recorded_at)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {note.tags.map((tag) => (
            <span key={tag.id} className="mc-badge mc-badge-neutral">
              {tag.name}
            </span>
          ))}
          {canEdit && (
            <>
              <TintedIconButton
                icon={<Pencil size={12} strokeWidth={2.2} aria-hidden />}
                tone="brand"
                label="Edit note"
                onClick={() => setShowEdit(true)}
              />
              <TintedIconButton
                icon={<Trash2 size={12} strokeWidth={2.2} aria-hidden />}
                tone="danger"
                label="Delete note"
                onClick={() => setShowDelete(true)}
              />
            </>
          )}
        </div>
      </div>

      <p
        className="mc-pair-value"
        style={{ marginTop: 6, fontSize: 13.5, whiteSpace: "pre-wrap" }}
      >
        {note.note}
      </p>

      <NoteEditModal
        patientId={patientId}
        note={note}
        open={showEdit}
        onClose={() => setShowEdit(false)}
      />
      <NoteDeleteModal
        patientId={patientId}
        note={note}
        open={showDelete}
        onClose={() => setShowDelete(false)}
      />
    </div>
  );
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function SessionCard({
  patientId,
  session,
  canEdit,
}: {
  patientId: string;
  session: MonitoringSession;
  canEdit: boolean;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className="mc-card"
      style={{
        padding: "10px 12px",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--c-border-soft)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
      >
        <InitialsAvatar name={session.added_by_name || "?"} size={26} />
        <div style={{ minWidth: 0 }}>
          <div className="mc-row-title" style={{ fontSize: 13.5 }}>
            {session.added_by_name}
          </div>
          <div
            className="mc-row-meta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            <Clock size={10} strokeWidth={2.2} aria-hidden />
            {formatDateTime(session.recorded_at)}
          </div>
        </div>
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
      >
        <span className="mc-badge mc-badge-neutral">
          {formatDuration(session.duration_seconds)}
        </span>
        {canEdit && (
          <>
            <TintedIconButton
              icon={<Pencil size={12} strokeWidth={2.2} aria-hidden />}
              tone="brand"
              label="Edit session"
              onClick={() => setShowEdit(true)}
            />
            <TintedIconButton
              icon={<Trash2 size={12} strokeWidth={2.2} aria-hidden />}
              tone="danger"
              label="Delete session"
              onClick={() => setShowDelete(true)}
            />
          </>
        )}
      </div>

      <SessionEditModal
        patientId={patientId}
        session={session}
        open={showEdit}
        onClose={() => setShowEdit(false)}
      />
      <SessionDeleteModal
        patientId={patientId}
        session={session}
        open={showDelete}
        onClose={() => setShowDelete(false)}
      />
    </div>
  );
}
