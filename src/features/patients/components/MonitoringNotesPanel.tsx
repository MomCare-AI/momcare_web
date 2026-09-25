"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import {
  useClinicalTags,
  useDeleteNote,
  useDeleteSession,
  usePatientMonitoring,
  useSearchPatientNotes,
  useUpdateNote,
  useUpdateSession,
} from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type {
  MonitoringNote,
  MonitoringSession,
  TimelineEntry,
} from "@/features/monitoring-notes/types";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";
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

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonitoringNotesPanel({
  patientId,
  patientLocationName,
}: {
  patientId: string;
  patientLocationName?: string;
}) {
  const { user, isHospitalAdmin } = usePortal();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showLogModal, setShowLogModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const debouncedSearch = useDebouncedValue(searchText, 350);
  // A tag-only filter (no typed text) activates search mode on its own.
  const searchActive = Boolean(debouncedSearch.trim() || tagFilter);

  const timeline = usePatientMonitoring(patientId, year, month);
  const searchResults = useSearchPatientNotes(patientId, {
    search: debouncedSearch.trim(),
    tagId: tagFilter,
  });
  const tagsQuery = useClinicalTags();

  const canEdit = (addedById: string) =>
    isHospitalAdmin || addedById === user.id;

  const goToMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="mc-btn-ghost mc-btn-sm"
                  onClick={() => goToMonth(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={14} strokeWidth={2} aria-hidden />
                </button>
                <span
                  style={{
                    fontWeight: 700,
                    minWidth: 130,
                    textAlign: "center",
                  }}
                >
                  {MONTH_NAMES[month - 1]} {year}
                </span>
                <button
                  type="button"
                  className="mc-btn-ghost mc-btn-sm"
                  onClick={() => goToMonth(1)}
                  aria-label="Next month"
                >
                  <ChevronRight size={14} strokeWidth={2} aria-hidden />
                </button>
              </div>
              {totalFormatted && (
                <span className="mc-badge mc-badge-neutral">
                  <Clock size={12} strokeWidth={2.2} aria-hidden />{" "}
                  {totalFormatted} logged
                </span>
              )}
            </div>

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
  const [editing, setEditing] = useState(false);

  return (
    <motion.div
      style={{
        padding: "16px 0",
        borderBottom: "1px solid var(--c-border-soft)",
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <InitialsAvatar name={note.added_by_name || "?"} size={34} />
          <div>
            <div className="mc-row-title">{note.added_by_name}</div>
            <div className="mc-row-meta">
              <Clock
                size={11}
                strokeWidth={2.2}
                aria-hidden
                style={{ verticalAlign: -1, marginRight: 3 }}
              />
              {formatDateTime(note.recorded_at)}
            </div>
          </div>
        </div>
        {canEdit && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconButton
              icon={<Pencil size={13} strokeWidth={2.2} aria-hidden />}
              tone="brand"
              label="Edit note"
              onClick={() => setEditing((v) => !v)}
            />
            <DeleteButton patientId={patientId} noteId={note.id} />
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, marginLeft: 44 }}>
        <p
          className="mc-pair-value"
          style={{ whiteSpace: "pre-wrap", margin: 0 }}
        >
          {note.note}
        </p>
        {(note.left_voicemail || note.two_way_communication) && (
          <span
            className="mc-badge mc-badge-info"
            style={{ marginTop: 6, display: "inline-flex" }}
          >
            {note.left_voicemail ? "Left voicemail" : "Reached her"}
          </span>
        )}
        {note.tags.length > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}
          >
            {note.tags.map((tag) => (
              <span key={tag.id} className="mc-badge mc-badge-neutral">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div style={{ marginTop: 10, marginLeft: 44 }}>
          <NoteEditForm
            patientId={patientId}
            note={note}
            onDone={() => setEditing(false)}
          />
        </div>
      )}
    </motion.div>
  );
}

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
  const [editingSession, setEditingSession] = useState(false);
  const [editingNote, setEditingNote] = useState(false);

  return (
    <motion.div
      style={{
        padding: "16px 0",
        borderBottom: "1px solid var(--c-border-soft)",
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <InitialsAvatar name={person || "?"} size={34} />
          <div>
            <div className="mc-row-title">{person}</div>
            <div className="mc-row-meta">
              <Clock
                size={11}
                strokeWidth={2.2}
                aria-hidden
                style={{ verticalAlign: -1, marginRight: 3 }}
              />
              {formatDateTime(entry.recorded_at)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {session && (
            <span className="mc-badge mc-badge-neutral">
              {Math.round(session.duration_seconds / 60)} min
            </span>
          )}
          {session && canEdit(session.added_by) && (
            <IconButton
              icon={<Pencil size={13} strokeWidth={2.2} aria-hidden />}
              tone="brand"
              label="Edit duration"
              onClick={() => setEditingSession((v) => !v)}
            />
          )}
          {note && canEdit(note.added_by) && (
            <IconButton
              icon={<Pencil size={13} strokeWidth={2.2} aria-hidden />}
              tone="brand"
              label="Edit note"
              onClick={() => setEditingNote((v) => !v)}
            />
          )}
          {(session || note) && canEdit((session ?? note)!.added_by) && (
            <DeleteButton
              patientId={patientId}
              sessionId={session?.id}
              noteId={note?.id}
            />
          )}
        </div>
      </div>

      {note && (
        <div style={{ marginTop: 8, marginLeft: 44 }}>
          <p
            className="mc-pair-value"
            style={{ whiteSpace: "pre-wrap", margin: 0 }}
          >
            {note.note}
          </p>
          {(note.left_voicemail || note.two_way_communication) && (
            <span
              className="mc-badge mc-badge-info"
              style={{ marginTop: 6, display: "inline-flex" }}
            >
              {note.left_voicemail ? "Left voicemail" : "Reached her"}
            </span>
          )}
          {note.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 8,
              }}
            >
              {note.tags.map((tag) => (
                <span key={tag.id} className="mc-badge mc-badge-neutral">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {session && editingSession && (
        <div style={{ marginTop: 10, marginLeft: 44 }}>
          <SessionEditForm
            patientId={patientId}
            session={session}
            onDone={() => setEditingSession(false)}
          />
        </div>
      )}

      {note && editingNote && (
        <div style={{ marginTop: 10, marginLeft: 44 }}>
          <NoteEditForm
            patientId={patientId}
            note={note}
            onDone={() => setEditingNote(false)}
          />
        </div>
      )}
    </motion.div>
  );
}

function IconButton({
  icon,
  tone,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  tone: "brand" | "danger";
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "grid",
        placeItems: "center",
        width: 30,
        height: 30,
        borderRadius: "var(--r-control)",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        color: tone === "danger" ? "var(--c-high-text)" : "var(--c-teal)",
        background:
          tone === "danger" ? "var(--c-high-soft)" : "var(--c-teal-wash)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
    </button>
  );
}

function DeleteButton({
  patientId,
  sessionId,
  noteId,
}: {
  patientId: string;
  sessionId?: string;
  noteId?: string;
}) {
  const delSession = useDeleteSession(patientId);
  const delNote = useDeleteNote(patientId);
  const pending = delSession.isPending || delNote.isPending;

  return (
    <IconButton
      icon={<Trash2 size={13} strokeWidth={2.2} aria-hidden />}
      tone="danger"
      label={sessionId ? "Delete session" : "Delete note"}
      disabled={pending}
      onClick={() => {
        if (sessionId) delSession.mutate(sessionId);
        if (noteId) delNote.mutate(noteId);
      }}
    />
  );
}

function SessionEditForm({
  patientId,
  session,
  onDone,
}: {
  patientId: string;
  session: MonitoringSession;
  onDone: () => void;
}) {
  const [minutes, setMinutes] = useState(
    String(Math.round(session.duration_seconds / 60))
  );
  const update = useUpdateSession(patientId);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        className="mc-input"
        type="number"
        min="1"
        style={{ width: 90 }}
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
      />
      <button
        type="button"
        className="mc-btn-ghost mc-btn-sm"
        onClick={onDone}
        disabled={update.isPending}
      >
        Cancel
      </button>
      <button
        type="button"
        className="mc-btn mc-btn-sm"
        disabled={update.isPending || !Number(minutes)}
        onClick={() =>
          update.mutate(
            {
              sessionId: session.id,
              input: { duration_seconds: Math.round(Number(minutes) * 60) },
            },
            { onSuccess: onDone }
          )
        }
      >
        {update.isPending ? "Saving…" : "Save duration"}
      </button>
    </div>
  );
}

function NoteEditForm({
  patientId,
  note,
  onDone,
}: {
  patientId: string;
  note: MonitoringNote;
  onDone: () => void;
}) {
  const [text, setText] = useState(note.note);
  const update = useUpdateNote(patientId);

  return (
    <div>
      <textarea
        className="mc-input"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {update.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 8 }}>
          {update.error instanceof Error
            ? update.error.message
            : "Could not save this note."}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="mc-btn-ghost mc-btn-sm"
          onClick={onDone}
          disabled={update.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn mc-btn-sm"
          disabled={update.isPending || !text.trim()}
          onClick={() =>
            update.mutate(
              { noteId: note.id, input: { note: text.trim() } },
              { onSuccess: onDone }
            )
          }
        >
          {update.isPending ? "Saving…" : "Save note"}
        </button>
      </div>
    </div>
  );
}
