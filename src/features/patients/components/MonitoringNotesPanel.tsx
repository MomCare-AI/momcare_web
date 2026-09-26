"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Clock, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import { NoteDeleteModal } from "@/features/monitoring-notes/components/NoteDeleteModal";
import { NoteEditModal } from "@/features/monitoring-notes/components/NoteEditModal";
import { SessionEditModal } from "@/features/monitoring-notes/components/SessionEditModal";
import {
  useClinicalTags,
  useDeleteNote,
  useDeleteSession,
  usePatientMonitoring,
  useSearchPatientNotes,
} from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type {
  MonitoringNote,
  MonitoringSession,
  TimelineEntry,
} from "@/features/monitoring-notes/types";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { Modal } from "@/shared/ui/Modal";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
import { TintedIconButton } from "@/shared/ui/TintedIconButton";
import { LogSessionModal } from "./LogSessionModal";

/** ~350ms after the last keystroke, not on every keystroke. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function MonitoringNotesPanel({
  patientId,
  patientLocationName,
}: {
  patientId: string;
  patientLocationName?: string;
}) {
  const { user, isHospitalAdmin } = usePortal();
  const [showLogModal, setShowLogModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const debouncedSearch = useDebouncedValue(searchText, 350);
  // A tag-only filter (no typed text) activates search mode on its own.
  const searchActive = Boolean(debouncedSearch.trim() || tagFilter);

  const timeline = usePatientMonitoring(patientId);
  const searchResults = useSearchPatientNotes(patientId, {
    search: debouncedSearch.trim(),
    tagId: tagFilter,
  });
  const tagsQuery = useClinicalTags();

  const canEdit = (addedById: string) =>
    isHospitalAdmin || addedById === user.id;

  const entries = timeline.data?.results ?? [];
  const totalFormatted = timeline.data?.totals.total_formatted;

  return (
    <section className="mc-card">
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Clinical Notes</div>
          <div className="mc-card-sub">
            Calls, chart reviews, and follow-ups — separate from the readings a
            device sends automatically.
          </div>
        </div>
        <button className="mc-btn" onClick={() => setShowLogModal(true)}>
          <Plus size={15} strokeWidth={2} />
          Add Note
        </button>
      </div>

      <div className="mc-card-body">
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={14}
              strokeWidth={2}
              aria-hidden
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.5,
              }}
            />
            <input
              className="mc-input"
              style={{ paddingLeft: 30 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search notes, tags, authors…"
              aria-label="Search notes"
            />
          </div>
          {tagsQuery.data && tagsQuery.data.results.length > 0 && (
            <select
              className="mc-input"
              style={{ maxWidth: 160 }}
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              aria-label="Filter by tag"
            >
              <option value="">Any tag</option>
              {tagsQuery.data.results.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {searchActive ? (
          <SearchResults
            patientId={patientId}
            query={searchResults}
            canEdit={canEdit}
          />
        ) : (
          <>
            {totalFormatted && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 12,
                }}
              >
                <span className="mc-badge mc-badge-neutral">
                  <Clock size={12} strokeWidth={2.2} aria-hidden />{" "}
                  {totalFormatted} logged this month
                </span>
              </div>
            )}

            {timeline.isPending && (
              <div className="mc-rows">
                <RowSkeleton count={3} variant="plain" />
              </div>
            )}

            {timeline.isError && (
              <EmptyState
                icon={<AlertCircle size={20} strokeWidth={1.9} aria-hidden />}
                title="Couldn't load the contact log"
                text="This is a problem reaching the server, not an empty month. Refresh to try again."
              />
            )}

            {timeline.isSuccess &&
              (entries.length === 0 ? (
                <EmptyState
                  title="Nothing logged this month"
                  text="Calls, chart reviews and follow-ups you record will show up here."
                />
              ) : (
                <div className="mc-rows">
                  {entries.map((entry, index) => (
                    <TimelineRow
                      key={`${entry.session?.id ?? "n"}-${entry.note?.id ?? "s"}-${index}`}
                      entry={entry}
                      patientId={patientId}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              ))}
          </>
        )}
      </div>

      <LogSessionModal
        patientId={patientId}
        patientLocationName={patientLocationName}
        open={showLogModal}
        onClose={() => setShowLogModal(false)}
      />
    </section>
  );
}

function SearchResults({
  patientId,
  query,
  canEdit,
}: {
  patientId: string;
  query: ReturnType<typeof useSearchPatientNotes>;
  canEdit: (addedById: string) => boolean;
}) {
  const notes = query.data?.results ?? [];

  if (query.isPending) {
    return (
      <div className="mc-rows">
        <RowSkeleton count={3} variant="plain" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={20} strokeWidth={1.9} aria-hidden />}
        title="Couldn't search notes"
        text="This is a problem reaching the server, not an empty result. Try again."
      />
    );
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No matching notes"
        text="Try a different word, or clear the tag filter."
      />
    );
  }

  return (
    <div>
      {notes.map((note) => (
        <SearchResultRow
          key={note.id}
          patientId={patientId}
          note={note}
          canEdit={canEdit(note.added_by)}
        />
      ))}
    </div>
  );
}

function SearchResultRow({
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
    <motion.div
      className="mc-card"
      style={{
        padding: "10px 12px",
        marginBottom: 8,
        border: "1px solid var(--c-border-soft)",
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
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
      {(note.left_voicemail || note.two_way_communication) && (
        <span
          className="mc-badge mc-badge-info"
          style={{ marginTop: 4, display: "inline-flex" }}
        >
          {note.left_voicemail ? "Left voicemail" : "Reached her"}
        </span>
      )}

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
    </motion.div>
  );
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

/**
 * One row per timeline entry. A combined "log a contact" can carry a session
 * (duration) and/or a note (text/tags) together — rather than two separate
 * pencils for the two halves, there is one Edit action per row: it opens the
 * note editor when a note exists (the richer, more commonly edited half),
 * and the duration badge itself becomes a small button opening the session
 * editor whenever a session is also attached. One Delete action removes
 * whichever of the two this entry actually has, behind one confirm popup.
 */
function TimelineRow({
  entry,
  patientId,
  canEdit,
}: {
  entry: TimelineEntry;
  patientId: string;
  canEdit: (addedById: string) => boolean;
}) {
  const { session, note } = entry;
  const person = session?.added_by_name || note?.added_by_name || "";
  const [showSessionEdit, setShowSessionEdit] = useState(false);
  const [showNoteEdit, setShowNoteEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const owner = note ?? session;
  const rowCanEdit = Boolean(owner && canEdit(owner.added_by));

  return (
    <motion.div
      className="mc-card"
      style={{
        padding: "10px 12px",
        marginBottom: 8,
        border: "1px solid var(--c-border-soft)",
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
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
          <InitialsAvatar name={person || "?"} size={26} />
          <div style={{ minWidth: 0 }}>
            <div className="mc-row-title" style={{ fontSize: 13.5 }}>
              {person}
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
              {formatDateTime(entry.recorded_at)}
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
          {note?.tags.map((tag) => (
            <span key={tag.id} className="mc-badge mc-badge-neutral">
              {tag.name}
            </span>
          ))}
          {session &&
            (rowCanEdit ? (
              <button
                type="button"
                className="mc-badge mc-badge-neutral"
                style={{ cursor: "pointer", border: "none" }}
                title="Edit duration"
                onClick={() => setShowSessionEdit(true)}
              >
                {formatDuration(session.duration_seconds)}
              </button>
            ) : (
              <span className="mc-badge mc-badge-neutral">
                {formatDuration(session.duration_seconds)}
              </span>
            ))}
          {rowCanEdit && (
            <>
              {note && (
                <TintedIconButton
                  icon={<Pencil size={12} strokeWidth={2.2} aria-hidden />}
                  tone="brand"
                  label="Edit note"
                  onClick={() => setShowNoteEdit(true)}
                />
              )}
              <TintedIconButton
                icon={<Trash2 size={12} strokeWidth={2.2} aria-hidden />}
                tone="danger"
                label={
                  session && note
                    ? "Delete entry"
                    : note
                      ? "Delete note"
                      : "Delete session"
                }
                onClick={() => setShowDelete(true)}
              />
            </>
          )}
        </div>
      </div>

      {note && (
        <>
          <p
            className="mc-pair-value"
            style={{ marginTop: 6, fontSize: 13.5, whiteSpace: "pre-wrap" }}
          >
            {note.note}
          </p>
          {(note.left_voicemail || note.two_way_communication) && (
            <span
              className="mc-badge mc-badge-info"
              style={{ marginTop: 4, display: "inline-flex" }}
            >
              {note.left_voicemail ? "Left voicemail" : "Reached her"}
            </span>
          )}
        </>
      )}

      {session && (
        <SessionEditModal
          patientId={patientId}
          session={session}
          open={showSessionEdit}
          onClose={() => setShowSessionEdit(false)}
        />
      )}
      {note && (
        <NoteEditModal
          patientId={patientId}
          note={note}
          open={showNoteEdit}
          onClose={() => setShowNoteEdit(false)}
        />
      )}
      <EntryDeleteModal
        patientId={patientId}
        session={session}
        note={note}
        recordedAt={entry.recorded_at}
        personName={person}
        open={showDelete}
        onClose={() => setShowDelete(false)}
      />
    </motion.div>
  );
}

/**
 * One confirm popup for a timeline row's Delete action — removes whichever
 * of the session/note the entry actually carries (a combined "log a
 * contact" can have both, and both belong to the one entry a reader sees on
 * screen, so one confirm should clear the whole row rather than leaving a
 * dangling half behind).
 */
function EntryDeleteModal({
  patientId,
  session,
  note,
  recordedAt,
  personName,
  open,
  onClose,
}: {
  patientId: string;
  session: MonitoringSession | null;
  note: MonitoringNote | null;
  recordedAt: string;
  personName: string;
  open: boolean;
  onClose: () => void;
}) {
  const delSession = useDeleteSession(patientId);
  const delNote = useDeleteNote(patientId);
  const pending = delSession.isPending || delNote.isPending;
  const error = delSession.error ?? delNote.error;

  const confirm = async () => {
    if (session) await delSession.mutateAsync(session.id);
    if (note) await delNote.mutateAsync(note.id);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete entry"
      subtitle="This action can't be undone"
      icon={<Trash2 size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <p className="mc-hint" style={{ margin: 0 }}>
        The entry by <strong>{personName || "this staff member"}</strong> from{" "}
        <strong>{formatDateTime(recordedAt)}</strong> will be permanently
        removed from this patient&apos;s record.
      </p>

      {error && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
          {error instanceof Error
            ? error.message
            : "Could not delete this entry."}
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
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <button
          type="button"
          className="mc-btn-ghost"
          onClick={onClose}
          disabled={pending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn"
          style={{ background: "var(--c-high)" }}
          disabled={pending}
          onClick={confirm}
        >
          <Trash2 size={14} strokeWidth={2} aria-hidden />
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
