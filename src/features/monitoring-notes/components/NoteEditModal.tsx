"use client";

import { useState } from "react";
import { AlertCircle, Pencil, Tag as TagIcon } from "lucide-react";

import {
  useClinicalTags,
  useUpdateNote,
} from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type {
  MonitoringNote,
  TagSpec,
} from "@/features/monitoring-notes/types";
import { Modal } from "@/shared/ui/Modal";
import { TagChip } from "@/shared/ui/TagChip";

interface Props {
  patientId: string;
  note: MonitoringNote;
  open: boolean;
  onClose: () => void;
}

/** "Edit note" — a real popup instead of an inline expand, matching the
 *  reference platform's own modal. The "Tags" button reveals the same
 *  toggle/type-to-create picker `LogSessionModal` uses, seeded from the
 *  note's current tags, rather than a separate divergent tag UI. */
export function NoteEditModal({ patientId, note, open, onClose }: Props) {
  const update = useUpdateNote(patientId);
  const tagsQuery = useClinicalTags();

  const [text, setText] = useState(note.note);
  const [showTags, setShowTags] = useState(false);
  const [tags, setTags] = useState<TagSpec[]>(
    note.tags.map((t) => ({ id: t.id }))
  );
  const [tagDraft, setTagDraft] = useState("");
  const [leftVoicemail, setLeftVoicemail] = useState(note.left_voicemail);
  const [twoWayCommunication, setTwoWayCommunication] = useState(
    note.two_way_communication
  );
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setText(note.note);
      setShowTags(false);
      setTags(note.tags.map((t) => ({ id: t.id })));
      setTagDraft("");
      setLeftVoicemail(note.left_voicemail);
      setTwoWayCommunication(note.two_way_communication);
      setError(null);
    }
  }

  const toggleTag = (tagId: string) => {
    setTags((cur) =>
      cur.some((t) => "id" in t && t.id === tagId)
        ? cur.filter((t) => !("id" in t && t.id === tagId))
        : [...cur, { id: tagId }]
    );
  };

  const addDraftTag = () => {
    const name = tagDraft.trim();
    if (!name) return;
    if (!tags.some((t) => "name" in t && t.name === name)) {
      setTags((cur) => [...cur, { name }]);
    }
    setTagDraft("");
  };

  const selectedNames = tags
    .map((t) =>
      "id" in t
        ? tagsQuery.data?.results.find((x) => x.id === t.id)?.name
        : t.name
    )
    .filter(Boolean) as string[];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      (leftVoicemail || twoWayCommunication || tags.length > 0) &&
      !text.trim()
    ) {
      setError("Tags and call outcomes need a note to attach to.");
      return;
    }
    try {
      await update.mutateAsync({
        noteId: note.id,
        input: {
          note: text.trim(),
          tags_input: tags,
          left_voicemail: leftVoicemail,
          two_way_communication: twoWayCommunication,
        },
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this note."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit note"
      icon={<Pencil size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <form onSubmit={submit}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <div className="mc-label" style={{ margin: 0 }}>
            Note
          </div>
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            onClick={() => setShowTags((v) => !v)}
          >
            <TagIcon size={13} strokeWidth={2} aria-hidden />
            Tags
          </button>
        </div>
        <textarea
          className="mc-input"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {showTags && tagsQuery.data && tagsQuery.data.results.length > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}
          >
            {tagsQuery.data.results.map((tag) => (
              <TagChip
                key={tag.id}
                label={tag.name}
                active={tags.some((t) => "id" in t && t.id === tag.id)}
                onClick={() => toggleTag(tag.id)}
              />
            ))}
          </div>
        )}
        {showTags && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
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
        )}

        <p className="mc-hint" style={{ marginTop: 8 }}>
          {selectedNames.length > 0
            ? selectedNames.join(", ")
            : "No tags selected"}
        </p>

        <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
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
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            className="mc-btn-ghost"
            onClick={onClose}
            disabled={update.isPending}
          >
            Cancel
          </button>
          <button type="submit" className="mc-btn" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
