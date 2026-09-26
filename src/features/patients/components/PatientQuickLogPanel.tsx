"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Clock, Plus, X } from "lucide-react";

import { useLocations } from "@/features/locations/hooks/useLocations";
import { CreateTagModal } from "@/features/monitoring-notes/components/CreateTagModal";
import {
  useClinicalTags,
  useLogContact,
} from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type {
  CombinedMonitoringInput,
  TagSpec,
} from "@/features/monitoring-notes/types";
import { useNoteTemplates } from "@/features/note-templates/hooks/useNoteTemplates";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

interface Props {
  patientId: string;
  patientLocationName?: string;
}

/**
 * A compact "log a contact while you work" card, adapted from the reference
 * platform's own Readings-tab side panel. Its own live timer, independent
 * from `PatientHeaderBanner`'s — two self-contained stopwatches rather than
 * threading shared timer state through both, which would need lifting it up
 * to the page level for a feature this narrow. Note Template is wired to the
 * real `/api/note-templates/` catalogue (same `useNoteTemplates` hook
 * `LogSessionModal.tsx` uses) — hidden entirely when the hospital hasn't
 * created any yet, rather than shown disabled.
 * Everything else (tags, note text, call-outcome flags) reuses the same
 * `useLogContact`/`useClinicalTags` hooks `MonitoringNotesPanel.tsx` already
 * uses — one real save path, not a second one.
 */
export function PatientQuickLogPanel({
  patientId,
  patientLocationName,
}: Props) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [note, setNote] = useState("");
  const [pendingTags, setPendingTags] = useState<TagSpec[]>([]);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [leftVoicemail, setLeftVoicemail] = useState(false);
  const [twoWayCommunication, setTwoWayCommunication] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tagsQuery = useClinicalTags();
  const locationsQuery = useLocations();
  const logContact = useLogContact(patientId);
  const templatesQuery = useNoteTemplates();
  const noteTemplates = templatesQuery.data?.results ?? [];

  // Same fix as LogSessionModal: `GET /api/clinical-tags/` returns every
  // location's tags a hospital admin can see, but the combined-monitoring
  // endpoint only accepts an org-wide tag or one scoped to *this patient's*
  // own location — picking any other location's tag 400s with "Tag with id
  // ... does not exist." Filtered down to match the real submit-time scope.
  const patientLocationId = patientLocationName
    ? locationsQuery.data?.results.find((l) => l.name === patientLocationName)
        ?.id
    : undefined;
  const visibleTags = (tagsQuery.data?.results ?? []).filter(
    (t) =>
      !patientLocationName || !t.location || t.location === patientLocationId
  );

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const selectExistingTag = (tagId: string) => {
    if (!tagId) return;
    setPendingTags((tags) =>
      tags.some((t) => "id" in t && t.id === tagId)
        ? tags
        : [...tags, { id: tagId }]
    );
  };

  const removeTag = (index: number) => {
    setPendingTags((tags) => tags.filter((_, i) => i !== index));
  };

  const tagLabel = (spec: TagSpec): string =>
    "id" in spec
      ? (visibleTags.find((t) => t.id === spec.id)?.name ?? "Tag")
      : spec.name;

  const selectableTags = visibleTags.filter(
    (t) => !pendingTags.some((p) => "id" in p && p.id === t.id)
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const noteText = note.trim();
    if (seconds === 0 && !noteText) {
      setError("Log at least some time or a note.");
      return;
    }
    if ((leftVoicemail || twoWayCommunication) && !noteText) {
      setError("Recording a call outcome needs a note.");
      return;
    }

    const input: CombinedMonitoringInput = {
      duration_seconds: seconds || null,
      note: noteText,
      tags: pendingTags,
      left_voicemail: leftVoicemail,
      two_way_communication: twoWayCommunication,
    };

    try {
      await logContact.mutateAsync(input);
      setSeconds(0);
      setRunning(true);
      setNote("");
      setPendingTags([]);
      setLeftVoicemail(false);
      setTwoWayCommunication(false);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this.");
    }
  };

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="mc-card-title">
            <Clock
              size={15}
              strokeWidth={1.9}
              aria-hidden
              style={{ verticalAlign: -2, marginRight: 6 }}
            />
            Monitoring
          </div>
          <div className="mc-card-sub">
            Track time spent and log a care note
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={submit}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <label className="mc-label" style={{ marginBottom: 0 }}>
              TIME SPENT
            </label>
            <span
              className="mc-hint"
              style={{ color: running ? "var(--c-teal)" : undefined }}
            >
              {running ? "Live: " : "Paused: "}
              {pad(mins)}:{pad(secs)}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
              background: "var(--c-teal-wash)",
              borderRadius: "var(--r-control)",
              padding: "14px 0",
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            {[
              { value: hrs, label: "HR" },
              { value: mins, label: "MIN" },
              { value: secs, label: "SEC" },
            ].map((box, i) => (
              <span
                key={box.label}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                {i > 0 && <span style={{ color: "var(--c-faint)" }}>:</span>}
                <span style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--c-ink)",
                      fontVariantNumeric: "tabular-nums",
                      background: "var(--c-card)",
                      borderRadius: 6,
                      padding: "4px 10px",
                      minWidth: 40,
                    }}
                  >
                    {pad(box.value)}
                  </div>
                  <div className="mc-hint" style={{ marginTop: 2 }}>
                    {box.label}
                  </div>
                </span>
              </span>
            ))}
          </div>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              onClick={() => setRunning((r) => !r)}
            >
              {running ? "Pause" : "Resume"}
            </button>
          </div>

          <label className="mc-label" htmlFor="quicklog-datetime">
            DATE &amp; TIME
          </label>
          <input
            id="quicklog-datetime"
            className="mc-input"
            value={new Date().toLocaleString()}
            disabled
            style={{ marginBottom: 14 }}
          />

          {noteTemplates.length > 0 && (
            <>
              <label className="mc-label" htmlFor="quicklog-template">
                NOTE TEMPLATE
              </label>
              <select
                id="quicklog-template"
                className="mc-input"
                defaultValue=""
                style={{ marginBottom: 14 }}
                onChange={(e) => {
                  const tpl = noteTemplates.find(
                    (t) => t.id === e.target.value
                  );
                  if (tpl) setNote(tpl.content);
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
            </>
          )}

          <label className="mc-label" htmlFor="quicklog-note">
            NOTES
          </label>
          <textarea
            id="quicklog-note"
            className="mc-input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter your notes here…."
            style={{ marginBottom: 10 }}
          />

          <label className="mc-label" htmlFor="quicklog-tag-select">
            TAGS
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select
              id="quicklog-tag-select"
              className="mc-input"
              value=""
              disabled={selectableTags.length === 0}
              onChange={(e) => selectExistingTag(e.target.value)}
            >
              <option value="" disabled>
                {selectableTags.length > 0
                  ? "Select a tag to add"
                  : "No more tags to add"}
              </option>
              {selectableTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              onClick={() => setShowCreateTag(true)}
            >
              <Plus size={13} strokeWidth={2} aria-hidden />
              Add Tag
            </button>
          </div>
          {pendingTags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 14,
              }}
            >
              {pendingTags.map((t, i) => (
                <span
                  key={"id" in t ? t.id : `${t.name}-${i}`}
                  className="mc-badge mc-badge-info"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {tagLabel(t)}
                  <button
                    type="button"
                    aria-label={`Remove ${tagLabel(t)}`}
                    onClick={() => removeTag(i)}
                    style={{
                      display: "grid",
                      placeItems: "center",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 0,
                      color: "inherit",
                    }}
                  >
                    <X size={11} strokeWidth={2.5} aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 18, marginBottom: 14 }}>
            <label style={{ display: "flex", gap: 6, fontSize: 13.5 }}>
              <input
                type="checkbox"
                checked={twoWayCommunication}
                onChange={(e) => {
                  setTwoWayCommunication(e.target.checked);
                  if (e.target.checked) setLeftVoicemail(false);
                }}
              />
              Two-Way Communication
            </label>
            <label style={{ display: "flex", gap: 6, fontSize: 13.5 }}>
              <input
                type="checkbox"
                checked={leftVoicemail}
                onChange={(e) => {
                  setLeftVoicemail(e.target.checked);
                  if (e.target.checked) setTwoWayCommunication(false);
                }}
              />
              Voicemail
            </label>
          </div>

          {error && (
            <p className="mc-alert mc-alert-error" style={{ marginBottom: 14 }}>
              <AlertCircle size={14} strokeWidth={2} aria-hidden />
              {error}
            </p>
          )}
          {saved && !logContact.isPending && (
            <p
              className="mc-alert mc-alert-success"
              style={{ marginBottom: 14 }}
            >
              Saved.
            </p>
          )}

          <div style={{ textAlign: "right" }}>
            <button
              type="submit"
              className="mc-btn"
              disabled={logContact.isPending}
            >
              {logContact.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </CardBody>

      <CreateTagModal
        open={showCreateTag}
        onClose={() => setShowCreateTag(false)}
        patientLocationId={patientLocationId}
        onCreated={(tag) => setPendingTags((tags) => [...tags, tag])}
      />
    </Card>
  );
}
