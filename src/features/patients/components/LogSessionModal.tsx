"use client";

import { useState } from "react";
import { AlertCircle, Clock, Plus } from "lucide-react";

import { useLocations } from "@/features/locations/hooks/useLocations";
import {
  useClinicalTags,
  useLogContact,
} from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type { TagSpec } from "@/features/monitoring-notes/types";
import { useNoteTemplates } from "@/features/note-templates/hooks/useNoteTemplates";
import { Modal } from "@/shared/ui/Modal";
import { TagChip } from "@/shared/ui/TagChip";

function toLocalDateTimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

interface Props {
  patientId: string;
  /** The patient's own site — needed to filter the tag picker down to tags
   *  the server will actually accept (see the `tagsQuery`/`visibleTags`
   *  comment below). Optional only because a couple of callers don't have
   *  it handy yet; the picker just shows every visible tag unfiltered in
   *  that case, same as before this fix. */
  patientLocationName?: string;
  open: boolean;
  onClose: () => void;
  /** Pre-fills Time Spent — e.g. the header's own running live timer,
   *  handed off here instead of instant-saving on its own. */
  initialSeconds?: number;
  onSaved?: () => void;
}

/**
 * "Add Monitoring Session" — the same combined session+note+tags endpoint
 * (`POST /api/patients/{id}/monitoring/`) the Notes tab's inline form and
 * the header's live timer both already use, presented as a real popup.
 * Matches the reference platform's own modal field-for-field except one
 * deliberate drop: a Session Type RPM/CCM toggle — MomCare runs a single
 * programme, so `MonitoringSession` has no such column to set.
 */
export function LogSessionModal({
  patientId,
  patientLocationName,
  open,
  onClose,
  initialSeconds = 0,
  onSaved,
}: Props) {
  const logContact = useLogContact(patientId);
  const tagsQuery = useClinicalTags();
  const templatesQuery = useNoteTemplates();
  const noteTemplates = templatesQuery.data?.results ?? [];
  const locationsQuery = useLocations();

  // `GET /api/clinical-tags/` (visible_clinical_tags) returns org-wide tags
  // plus every location's own tags a hospital admin can see across the
  // whole org — broader than what the server will actually accept here.
  // `services.get_or_create_tags`/`_tag_scope` only accepts an org-wide tag
  // or a tag scoped to *this patient's own location*; picking a tag from a
  // different location 400s with "Tag with id ... does not exist." Filter
  // the picker down to match the real submit-time scope so that can't
  // happen. `Patient`/`PatientDetail` only expose `location_name`, not a
  // location id, so the match goes through the locations list by name.
  const patientLocationId = patientLocationName
    ? locationsQuery.data?.results.find((l) => l.name === patientLocationName)
        ?.id
    : undefined;
  const visibleTags = (tagsQuery.data?.results ?? []).filter(
    (t) =>
      !patientLocationName || !t.location || t.location === patientLocationId
  );

  const emptyState = () => ({
    hours: String(Math.floor(initialSeconds / 3600)),
    minutes: String(Math.floor((initialSeconds % 3600) / 60)),
    seconds: String(initialSeconds % 60),
    recordedAt: toLocalDateTimeValue(new Date()),
    note: "",
    leftVoicemail: false,
    twoWayCommunication: false,
  });

  const [form, setForm] = useState(emptyState);
  const [pendingTags, setPendingTags] = useState<TagSpec[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(emptyState());
      setPendingTags([]);
      setTagDraft("");
      setError(null);
    }
  }

  const toggleTag = (tagId: string) => {
    setPendingTags((tags) =>
      tags.some((t) => "id" in t && t.id === tagId)
        ? tags.filter((t) => !("id" in t && t.id === tagId))
        : [...tags, { id: tagId }]
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

  const applyTemplate = (templateId: string) => {
    const tpl = noteTemplates.find((t) => t.id === templateId);
    if (tpl) setForm((f) => ({ ...f, note: tpl.content }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const totalSeconds =
      (Number(form.hours) || 0) * 3600 +
      (Number(form.minutes) || 0) * 60 +
      (Number(form.seconds) || 0);
    const noteText = form.note.trim();

    if (!totalSeconds && !noteText) {
      setError("Log at least a duration or a note.");
      return;
    }
    if (
      (form.leftVoicemail ||
        form.twoWayCommunication ||
        pendingTags.length > 0) &&
      !noteText
    ) {
      setError("Tags and call outcomes need a note to attach to.");
      return;
    }

    try {
      await logContact.mutateAsync({
        duration_seconds: totalSeconds ? totalSeconds : null,
        recorded_at: new Date(form.recordedAt).toISOString(),
        note: noteText,
        tags: pendingTags,
        left_voicemail: form.leftVoicemail,
        two_way_communication: form.twoWayCommunication,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not log this session."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Monitoring Session"
      subtitle="Log time, notes, and tags for this patient"
      icon={<Clock size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <div className="mc-label">Time Spent</div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            {(
              [
                ["hours", "HR"],
                ["minutes", "MIN"],
                ["seconds", "SEC"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} style={{ flex: 1 }}>
                <input
                  className="mc-input"
                  type="number"
                  min="0"
                  style={{ textAlign: "center" }}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
                <div
                  className="mc-hint"
                  style={{ textAlign: "center", marginTop: 3 }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="mc-label" htmlFor="session-recorded-at">
            Date &amp; Time
          </label>
          <input
            id="session-recorded-at"
            className="mc-input"
            type="datetime-local"
            value={form.recordedAt}
            onChange={(e) => setForm({ ...form, recordedAt: e.target.value })}
          />
        </div>

        {noteTemplates.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label className="mc-label" htmlFor="session-template">
              Note Template
            </label>
            <select
              id="session-template"
              className="mc-input"
              defaultValue=""
              onChange={(e) => {
                applyTemplate(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Select note template
              </option>
              {noteTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div className="mc-label">Notes</div>
          <textarea
            className="mc-input"
            rows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Enter your notes here…"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="mc-label">Tags</div>
          {visibleTags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 8,
              }}
            >
              {visibleTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  label={tag.name}
                  active={pendingTags.some((t) => "id" in t && t.id === tag.id)}
                  onClick={() => toggleTag(tag.id)}
                />
              ))}
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
              <Plus size={13} strokeWidth={2} aria-hidden />
              Add Tag
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

        <div style={{ display: "flex", gap: 18 }}>
          <label style={{ display: "flex", gap: 6, fontSize: 13.5 }}>
            <input
              type="checkbox"
              checked={form.twoWayCommunication}
              onChange={(e) =>
                setForm({
                  ...form,
                  twoWayCommunication: e.target.checked,
                  leftVoicemail: e.target.checked ? false : form.leftVoicemail,
                })
              }
            />
            Two-Way Communication
          </label>
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
            Voicemail
          </label>
        </div>

        {error && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 16 }}>
            <AlertCircle size={15} strokeWidth={2} aria-hidden />
            {error}
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
            disabled={logContact.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mc-btn"
            disabled={logContact.isPending}
          >
            {logContact.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
