"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import {
  useCreateNoteTemplate,
  useDeleteNoteTemplate,
  useNoteTemplates,
  useUpdateNoteTemplate,
} from "@/features/note-templates/hooks/useNoteTemplates";
import type { NoteTemplate } from "@/features/note-templates/types";
import { ActionMenu, ActionMenuItem } from "@/shared/ui/ActionMenu";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Canned snippet text staff can reuse while logging a contact note. Real
 * backend as of 2026-09-25 (`GET/POST /api/note-templates/`,
 * `GET/PATCH/DELETE /api/note-templates/{id}/` — see the backend's own
 * note-templates design doc), same org/location-scoped shape as
 * `ClinicalTag`/`StatusLabel`. Read is open to any hospital staff; write
 * (create/edit/delete) is hospital_admin only — the server enforces this
 * too, this just avoids showing controls that would 403.
 */
export function NoteTemplatesTab() {
  const { isHospitalAdmin } = usePortal();
  const templatesQuery = useNoteTemplates();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const templates = templatesQuery.data?.results ?? [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? templates.filter((t) => t.title.toLowerCase().includes(q))
      : templates;
  }, [templates, search]);

  return (
    <>
      <Card>
        {templatesQuery.isSuccess && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              padding: "14px 20px 0",
            }}
          >
            <div style={{ position: "relative", maxWidth: 320, flex: 1 }}>
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                aria-label="Search templates"
              />
            </div>

            {isHospitalAdmin && (
              <button className="mc-btn" onClick={() => setShowCreate(true)}>
                <Plus size={15} strokeWidth={2} aria-hidden />
                Add template
              </button>
            )}
          </div>
        )}

        {templatesQuery.isPending && (
          <CardBody>
            <div className="mc-rows">
              <RowSkeleton count={3} variant="plain" />
            </div>
          </CardBody>
        )}

        {templatesQuery.isError && (
          <CardBody>
            <EmptyState
              icon={<AlertCircle size={20} strokeWidth={1.9} aria-hidden />}
              title="Couldn't load templates"
              text="This is a problem reaching the server, not an empty list. Refresh to try again."
            />
          </CardBody>
        )}

        {templatesQuery.isSuccess &&
          (rows.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<FileText size={20} strokeWidth={1.9} aria-hidden />}
                title={
                  templates.length === 0
                    ? "No templates yet"
                    : "No templates match"
                }
                text={
                  templates.length === 0
                    ? "Templates created here show up in the template picker on the Log a Contact form, for every clinician at this hospital."
                    : "Try a different search term."
                }
              />
            </CardBody>
          ) : (
            <div className="mc-rows" style={{ padding: "14px 20px 20px" }}>
              {rows.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  canManage={isHospitalAdmin}
                  expanded={expandedId === t.id}
                  onToggleExpand={() =>
                    setExpandedId(expandedId === t.id ? null : t.id)
                  }
                />
              ))}
            </div>
          ))}
      </Card>

      <TemplateFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </>
  );
}

function TemplateRow({
  template,
  canManage,
  expanded,
  onToggleExpand,
}: {
  template: NoteTemplate;
  canManage: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const long = template.content.length > 140;

  return (
    <div
      className="mc-row"
      style={{ cursor: "pointer", flexWrap: "wrap" }}
      onClick={onToggleExpand}
    >
      <div className="mc-row-main">
        <div className="mc-row-title">{template.title}</div>
        <div className="mc-row-meta">
          {expanded || !long
            ? template.content
            : `${template.content.slice(0, 140)}…`}
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
          {template.updated_by_name
            ? `${template.updated_by_name} · ${timeAgo(template.updated_at)}`
            : timeAgo(template.updated_at)}
        </div>
      </div>
      {canManage && (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionMenu label="Template actions">
            <ActionMenuItem
              icon={<Pencil size={13} strokeWidth={2} aria-hidden />}
              label="Edit"
              onClick={() => setShowEdit(true)}
            />
            <ActionMenuItem
              icon={<Trash2 size={13} strokeWidth={2} aria-hidden />}
              label="Delete"
              danger
              onClick={() => setShowDelete(true)}
            />
          </ActionMenu>
        </div>
      )}

      <TemplateFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        template={template}
      />
      <DeleteTemplateModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        template={template}
      />
    </div>
  );
}

function TemplateFormModal({
  open,
  onClose,
  template,
}: {
  open: boolean;
  onClose: () => void;
  template?: NoteTemplate;
}) {
  const { org } = usePortal();
  const createTemplate = useCreateNoteTemplate();
  const updateTemplate = useUpdateNoteTemplate();
  const isEdit = !!template;

  const [form, setForm] = useState({
    title: template?.title ?? "",
    content: template?.content ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm({
        title: template?.title ?? "",
        content: template?.content ?? "",
      });
      setError(null);
    }
  }

  const pending = createTemplate.isPending || updateTemplate.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateTemplate.mutateAsync({
          templateId: template.id,
          input: { title: form.title, content: form.content },
        });
      } else {
        await createTemplate.mutateAsync({
          title: form.title,
          content: form.content,
          organization: org.id,
        });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this template."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit template" : "Add template"}
      subtitle="Reusable note text every clinician can reuse while logging a contact"
      icon={<FileText size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <label className="mc-label" htmlFor="template-title">
            Title <span className="mc-req">*</span>
          </label>
          <input
            id="template-title"
            className="mc-input"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Missed Appointment Follow-up"
          />
        </div>
        <div>
          <label className="mc-label" htmlFor="template-content">
            Content <span className="mc-req">*</span>
          </label>
          <textarea
            id="template-content"
            className="mc-input"
            rows={4}
            required
            style={{ resize: "vertical" }}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="The reusable text itself"
          />
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
            disabled={pending}
          >
            Cancel
          </button>
          <button type="submit" className="mc-btn" disabled={pending}>
            <Plus size={15} strokeWidth={2} aria-hidden />
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add template"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteTemplateModal({
  open,
  onClose,
  template,
}: {
  open: boolean;
  onClose: () => void;
  template: NoteTemplate;
}) {
  const deleteTemplate = useDeleteNoteTemplate();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete template"
      subtitle={template.title}
    >
      <p className="mc-hint">
        This removes the template from the picker on the Log a Contact form.
        Notes already logged from this template keep their own text — nothing
        references this entry.
      </p>

      {deleteTemplate.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
          {deleteTemplate.error instanceof Error
            ? deleteTemplate.error.message
            : "Could not delete this template."}
        </p>
      )}

      <div
        className="mc-card-foot"
        style={{
          padding: "12px 0 0",
          marginTop: 16,
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
          disabled={deleteTemplate.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn"
          style={{ background: "var(--c-high)" }}
          disabled={deleteTemplate.isPending}
          onClick={() =>
            deleteTemplate.mutate(template.id, { onSuccess: onClose })
          }
        >
          {deleteTemplate.isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
