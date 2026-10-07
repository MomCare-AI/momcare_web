"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import type { TextEntry } from "../types";

/**
 * A short list of text entries a doctor can add to, edit and remove — used for
 * the care team's notes and for medications. The two differ only in the title,
 * in who may write (`canWrite`), and in the plan being editable at all
 * (`editable`, false once finalized).
 *
 * Entry text is plain text; it is never rendered as HTML.
 */
export function CarePlanEntries({
  title,
  subtitle,
  emptyText,
  entries,
  canWrite,
  editable,
  addLabel,
  busy,
  error,
  onAdd,
  onEdit,
  onRemove,
  onDismissError,
}: {
  title: string;
  subtitle?: string;
  emptyText: string;
  entries: TextEntry[];
  canWrite: boolean;
  editable: boolean;
  addLabel: string;
  busy: boolean;
  error: string | null;
  onAdd: (text: string, done: () => void) => void;
  onEdit: (id: string, text: string, done: () => void) => void;
  onRemove: (id: string) => void;
  onDismissError: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const mayWrite = canWrite && editable;

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="mc-card-title">{title}</div>
          {subtitle && <div className="mc-card-sub">{subtitle}</div>}
        </div>
        {mayWrite && !adding && (
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            disabled={busy}
            onClick={() => {
              onDismissError();
              setAdding(true);
            }}
          >
            <Plus size={13} strokeWidth={2} aria-hidden />
            {addLabel}
          </button>
        )}
      </CardHeader>
      <CardBody>
        {adding && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (!text) return;
              onAdd(text, () => {
                setDraft("");
                setAdding(false);
              });
            }}
            style={{ marginBottom: 12 }}
          >
            <textarea
              className="mc-input"
              rows={2}
              maxLength={2000}
              aria-label={addLabel}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="mc-actions" style={{ marginTop: 8 }}>
              <button
                type="submit"
                className="mc-btn mc-btn-sm"
                disabled={busy || !draft.trim()}
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="mc-btn-ghost mc-btn-sm"
                disabled={busy}
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {entries.length === 0 && !adding ? (
          <p className="mc-hint">{emptyText}</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {entries.map((entry) => (
              <li
                key={entry.id}
                style={{
                  padding: "8px 0",
                  borderTop: "1px solid var(--c-border-soft)",
                }}
              >
                {editingId === entry.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const text = editDraft.trim();
                      if (!text) return;
                      onEdit(entry.id, text, () => setEditingId(null));
                    }}
                  >
                    <textarea
                      className="mc-input"
                      rows={2}
                      maxLength={2000}
                      aria-label="Edit text"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                    />
                    <div className="mc-actions" style={{ marginTop: 8 }}>
                      <button
                        type="submit"
                        className="mc-btn mc-btn-sm"
                        disabled={busy || !editDraft.trim()}
                      >
                        <Check size={13} strokeWidth={2} aria-hidden />
                        Save
                      </button>
                      <button
                        type="button"
                        className="mc-btn-ghost mc-btn-sm"
                        disabled={busy}
                        onClick={() => setEditingId(null)}
                      >
                        <X size={13} strokeWidth={2} aria-hidden />
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>
                        {entry.text}
                      </div>
                      <div className="mc-hint">
                        {[entry.added_by, formatDateTime(entry.created_at)]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    {mayWrite && (
                      <span style={{ display: "flex", gap: 4, flex: "none" }}>
                        <button
                          type="button"
                          className="mc-btn-ghost mc-btn-sm"
                          aria-label="Edit"
                          disabled={busy}
                          onClick={() => {
                            onDismissError();
                            setEditingId(entry.id);
                            setEditDraft(entry.text);
                          }}
                        >
                          <Pencil size={12} strokeWidth={2} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="mc-btn-ghost mc-btn-sm"
                          aria-label="Remove"
                          disabled={busy}
                          onClick={() => onRemove(entry.id)}
                        >
                          <Trash2 size={12} strokeWidth={2} aria-hidden />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p
            className="mc-alert mc-alert-error"
            role="alert"
            style={{ marginTop: 10 }}
          >
            {error}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
