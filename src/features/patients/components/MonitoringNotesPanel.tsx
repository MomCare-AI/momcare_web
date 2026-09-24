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
  X,
} from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import {
  useClinicalTags,
  useDeleteNote,
  useDeleteSession,
  useLogContact,
  usePatientMonitoring,
  useSearchPatientNotes,
  useUpdateNote,
  useUpdateSession,
} from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type {
  ClinicalTag,
  CombinedMonitoringInput,
  MonitoringNote,
  MonitoringSession,
  TagSpec,
  TimelineEntry,
} from "@/features/monitoring-notes/types";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

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

const EMPTY_FORM = {
  minutes: "",
  note: "",
  leftVoicemail: false,
  twoWayCommunication: false,
};

export function MonitoringNotesPanel({ patientId }: { patientId: string }) {
  const { user, isHospitalAdmin } = usePortal();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingTags, setPendingTags] = useState<TagSpec[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
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
  const logContact = useLogContact(patientId);

  const canEdit = (addedById: string) =>
    isHospitalAdmin || addedById === user.id;

  const goToMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const toggleTag = (tag: ClinicalTag) => {
    setPendingTags((tags) =>
      tags.some((t) => "id" in t && t.id === tag.id)
        ? tags.filter((t) => !("id" in t && t.id === tag.id))
        : [...tags, { id: tag.id }]
    );
  };

  const addDraftTag = () => {
    const name = tagDraft.trim();
    if (!name) return;
    if (!pendingTags.some((t) => "name" in t && t.name === name)) {
      setPendingTags((tags) => [...tags, { name }]);
    }
    setTagDraft("");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setPendingTags([]);
    setTagDraft("");
    setFormError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const minutes = form.minutes.trim() ? Number(form.minutes) : null;
    const noteText = form.note.trim();

    if (!minutes && !noteText) {
      setFormError("Log at least a duration or a note.");
      return;
    }
    if (pendingTags.length > 0 && !noteText) {
      setFormError("Tags need a note to attach to.");
      return;
    }
    if ((form.leftVoicemail || form.twoWayCommunication) && !noteText) {
      setFormError("Recording a call outcome needs a note.");
      return;
    }

    const input: CombinedMonitoringInput = {
      duration_seconds: minutes ? Math.round(minutes * 60) : null,
      note: noteText,
      tags: pendingTags,
      left_voicemail: form.leftVoicemail,
      two_way_communication: form.twoWayCommunication,
    };

    try {
      await logContact.mutateAsync(input);
      resetForm();
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not log this contact."
      );
    }
  };

  const entries = timeline.data?.results ?? [];
  const totalFormatted = timeline.data?.totals.total_formatted;

  return (
    <section className="mc-card">
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Clinical contact log</div>
          <div className="mc-card-sub">
            Calls, chart reviews, and follow-ups — separate from the readings a
            device sends automatically.
          </div>
        </div>
        <button className="mc-btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? (
            <X size={15} strokeWidth={2} />
          ) : (
            <Plus size={15} strokeWidth={2} />
          )}
          {showForm ? "Cancel" : "Log a contact"}
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
              placeholder="Search notes, any month…"
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

            {showForm && (
              <form
                onSubmit={submit}
                className="mc-card"
                style={{
                  padding: 14,
                  marginBottom: 18,
                  background: "var(--c-ground)",
                }}
              >
                <div className="mc-formgrid">
                  <div>
                    <label className="mc-label" htmlFor="contact-minutes">
                      Duration (minutes)
                    </label>
                    <input
                      id="contact-minutes"
                      className="mc-input"
                      type="number"
                      min="0"
                      step="1"
                      value={form.minutes}
                      onChange={(e) =>
                        setForm({ ...form, minutes: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label className="mc-label" htmlFor="contact-note">
                    Note
                  </label>
                  <textarea
                    id="contact-note"
                    className="mc-input"
                    rows={3}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="What was discussed or found — optional if you're only logging time"
                  />
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 18 }}>
                  <label style={{ display: "flex", gap: 6, fontSize: 13.5 }}>
                    <input
                      type="checkbox"
                      checked={form.leftVoicemail}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          leftVoicemail: e.target.checked,
                          twoWayCommunication: e.target.checked
                            ? false
                            : form.twoWayCommunication,
                        })
                      }
                    />
                    Left voicemail
                  </label>
                  <label style={{ display: "flex", gap: 6, fontSize: 13.5 }}>
                    <input
                      type="checkbox"
                      checked={form.twoWayCommunication}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          twoWayCommunication: e.target.checked,
                          leftVoicemail: e.target.checked
                            ? false
                            : form.leftVoicemail,
                        })
                      }
                    />
                    Reached her (two-way)
                  </label>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div className="mc-label">Tags</div>
                  {tagsQuery.data && tagsQuery.data.results.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {tagsQuery.data.results.map((tag) => {
                        const active = pendingTags.some(
                          (t) => "id" in t && t.id === tag.id
                        );
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            className="mc-badge mc-badge-neutral"
                            style={{
                              cursor: "pointer",
                              border: active
                                ? "1.5px solid var(--c-brand)"
                                : "1.5px solid transparent",
                            }}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="mc-input"
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addDraftTag();
                        }
                      }}
                      placeholder="Type a new tag and press Enter"
                    />
                    <button
                      type="button"
                      className="mc-btn-ghost mc-btn-sm"
                      onClick={addDraftTag}
                    >
                      Add
                    </button>
                  </div>
                  {pendingTags.filter((t) => "name" in t).length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      {pendingTags
                        .filter((t): t is { name: string } => "name" in t)
                        .map((t) => (
                          <span key={t.name} className="mc-badge mc-badge-info">
                            {t.name}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {formError && (
                  <p
                    className="mc-alert mc-alert-error"
                    style={{ marginTop: 14 }}
                  >
                    <AlertCircle size={15} strokeWidth={2} aria-hidden />
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  className="mc-btn"
                  style={{ marginTop: 14 }}
                  disabled={logContact.isPending}
                >
                  {logContact.isPending ? "Saving…" : "Save"}
                </button>
              </form>
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
    <div className="mc-rows">
      {notes.map((note) => (
        <motion.div
          key={note.id}
          className="mc-card"
          style={{ padding: 14 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mc-row-meta">
            {formatDateTime(note.recorded_at)}
            {note.added_by_name && ` · ${note.added_by_name}`}
          </div>
          <p
            className="mc-pair-value"
            style={{ marginTop: 8, whiteSpace: "pre-wrap" }}
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
          {canEdit(note.added_by) && (
            <div style={{ marginTop: 10 }}>
              <NoteActions patientId={patientId} note={note} />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

  return (
    <motion.div
      className="mc-card"
      style={{ padding: 14 }}
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
        <div>
          <div className="mc-row-meta">
            {formatDateTime(entry.recorded_at)}
            {person && ` · ${person}`}
          </div>
        </div>
        {session && (
          <span className="mc-badge mc-badge-neutral">
            <Clock size={12} strokeWidth={2.2} aria-hidden />{" "}
            {Math.round(session.duration_seconds / 60)} min
          </span>
        )}
      </div>

      {note && (
        <div style={{ marginTop: 8 }}>
          <p className="mc-pair-value" style={{ whiteSpace: "pre-wrap" }}>
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

      <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
        {session && canEdit(session.added_by) && (
          <SessionActions patientId={patientId} session={session} />
        )}
        {note && canEdit(note.added_by) && (
          <NoteActions patientId={patientId} note={note} />
        )}
      </div>
    </motion.div>
  );
}

function SessionActions({
  patientId,
  session,
}: {
  patientId: string;
  session: MonitoringSession;
}) {
  const [editing, setEditing] = useState(false);
  const [minutes, setMinutes] = useState(
    String(Math.round(session.duration_seconds / 60))
  );
  const update = useUpdateSession(patientId);
  const del = useDeleteSession(patientId);

  if (editing) {
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
          onClick={() => setEditing(false)}
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
              { onSuccess: () => setEditing(false) }
            )
          }
        >
          {update.isPending ? "Saving…" : "Save duration"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        className="mc-btn-ghost mc-btn-sm"
        onClick={() => setEditing(true)}
      >
        <Pencil size={12} strokeWidth={2.2} aria-hidden /> Edit duration
      </button>
      <button
        type="button"
        className="mc-btn-ghost mc-btn-sm mc-btn-danger"
        disabled={del.isPending}
        onClick={() => del.mutate(session.id)}
      >
        <Trash2 size={12} strokeWidth={2.2} aria-hidden />
        {del.isPending ? "Deleting…" : "Delete session"}
      </button>
    </div>
  );
}

function NoteActions({
  patientId,
  note,
}: {
  patientId: string;
  note: MonitoringNote;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.note);
  const update = useUpdateNote(patientId);
  const del = useDeleteNote(patientId);

  if (editing) {
    return (
      <div style={{ flex: 1 }}>
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
            onClick={() => setEditing(false)}
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
                { onSuccess: () => setEditing(false) }
              )
            }
          >
            {update.isPending ? "Saving…" : "Save note"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        className="mc-btn-ghost mc-btn-sm"
        onClick={() => setEditing(true)}
      >
        <Pencil size={12} strokeWidth={2.2} aria-hidden /> Edit note
      </button>
      <button
        type="button"
        className="mc-btn-ghost mc-btn-sm mc-btn-danger"
        disabled={del.isPending}
        onClick={() => del.mutate(note.id)}
      >
        <Trash2 size={12} strokeWidth={2.2} aria-hidden />
        {del.isPending ? "Deleting…" : "Delete note"}
      </button>
    </div>
  );
}
