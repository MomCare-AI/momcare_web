"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, FileText, Pencil, Plus, Trash2 } from "lucide-react";

import {
  addNoteTemplate,
  deleteNoteTemplate,
  updateNoteTemplate,
  type NoteTemplate,
} from "@/features/note-templates/store";
import { useNoteTemplates } from "@/features/note-templates/useNoteTemplates";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const EMPTY_FORM = { title: "", body: "" };

/**
 * Canned snippet text staff can reuse while logging a contact note — the
 * Neuro_RPM reference platform's "Notes" tab. MomCare's backend has no
 * matching NoteTemplate model yet (only ClinicalTag/MonitoringSession/
 * MonitoringNote exist — see core/monitoring), so this stays local-only,
 * backed by `features/note-templates/store.ts` (localStorage, shared with
 * the "Log a contact" form's template picker) rather than a real API —
 * the frontend shell to wire up once that backend piece exists.
 */
export function NoteTemplatesTab() {
  const templates = useNoteTemplates();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    addNoteTemplate(form.title.trim(), form.body.trim());
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  return (
    <>
      <p className="mc-alert mc-alert-notice" style={{ marginBottom: 18 }}>
        <AlertTriangle size={15} strokeWidth={2} aria-hidden />
        Not yet connected to the server — templates here aren&apos;t saved and
        will be gone on reload. This is a preview of the screen, waiting on a
        backend note-template catalogue.
      </p>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "14px 20px 0",
          }}
        >
          <button className="mc-btn" onClick={() => setShowForm(true)}>
            <Plus size={15} strokeWidth={2} aria-hidden />
            Add template
          </button>
        </div>

        {templates.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<FileText size={20} strokeWidth={1.9} aria-hidden />}
              title="No templates yet"
              text="Templates created here show up in the template picker on the Log a Contact form — but only on this browser, since nothing is saved to the server yet."
            />
          </CardBody>
        ) : (
          <div className="mc-rows">
            {templates.map((t, index) => (
              <TemplateRow
                key={t.id}
                template={t}
                index={index}
                editing={editingId === t.id}
                expanded={expandedId === t.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === t.id ? null : t.id)
                }
                onStartEdit={() => setEditingId(t.id)}
                onStopEdit={() => setEditingId(null)}
                onSave={(title, body) => updateNoteTemplate(t.id, title, body)}
                onDelete={() => deleteNoteTemplate(t.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Add template"
        subtitle="Reusable note text every clinician can reuse while logging a contact"
        icon={<FileText size={17} strokeWidth={2} aria-hidden />}
        tinted
      >
        <form onSubmit={submitCreate}>
          <div style={{ marginBottom: 16 }}>
            <label className="mc-label" htmlFor="new-template-title">
              Title <span className="mc-req">*</span>
            </label>
            <input
              id="new-template-title"
              className="mc-input"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Missed Appointment Follow-up"
            />
          </div>
          <div>
            <label className="mc-label" htmlFor="new-template-body">
              Body <span className="mc-req">*</span>
            </label>
            <textarea
              id="new-template-body"
              className="mc-input"
              rows={4}
              required
              style={{ resize: "vertical" }}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="The reusable text itself"
            />
          </div>

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
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="mc-btn">
              <Plus size={15} strokeWidth={2} aria-hidden />
              Add template
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function TemplateRow({
  template,
  index,
  editing,
  expanded,
  onToggleExpand,
  onStartEdit,
  onStopEdit,
  onSave,
  onDelete,
}: {
  template: NoteTemplate;
  index: number;
  editing: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onSave: (title: string, body: string) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(template.title);
  const [body, setBody] = useState(template.body);
  const long = template.body.length > 140;

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mc-card"
        style={{ padding: 14, background: "var(--c-ground)" }}
      >
        <div>
          <label className="mc-label" htmlFor={`tpl-title-${template.id}`}>
            Title
          </label>
          <input
            id={`tpl-title-${template.id}`}
            className="mc-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="mc-label" htmlFor={`tpl-body-${template.id}`}>
            Body
          </label>
          <textarea
            id={`tpl-body-${template.id}`}
            className="mc-input"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            onClick={onStopEdit}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mc-btn mc-btn-sm"
            disabled={!title.trim() || !body.trim()}
            onClick={() => {
              onSave(title.trim(), body.trim());
              onStopEdit();
            }}
          >
            Save changes
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mc-row"
      style={{ cursor: "pointer", flexWrap: "wrap" }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
      onClick={onToggleExpand}
    >
      <div className="mc-row-main">
        <div className="mc-row-title">{template.title}</div>
        <div className="mc-row-meta">
          {expanded || !long
            ? template.body
            : `${template.body.slice(0, 140)}…`}
          {long && (
            <button
              type="button"
              className="mc-link"
              style={{ marginLeft: 6, display: "inline" }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <div className="mc-row-meta" style={{ marginTop: 4 }}>
          {timeAgo(template.updatedAt)}
        </div>
      </div>
      <div className="mc-row-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="mc-btn-ghost mc-btn-sm"
          onClick={onStartEdit}
        >
          <Pencil size={13} strokeWidth={2} aria-hidden /> Edit
        </button>
        <button
          type="button"
          className="mc-btn-ghost mc-btn-sm mc-btn-danger"
          onClick={onDelete}
        >
          <Trash2 size={13} strokeWidth={2} aria-hidden /> Delete
        </button>
      </div>
    </motion.div>
  );
}
