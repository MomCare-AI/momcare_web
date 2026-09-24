"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Pencil, Plus, Tag, Trash2, X } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import {
  useClinicalTags,
  useCreateClinicalTag,
  useDeleteClinicalTag,
  useUpdateClinicalTag,
} from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type { ClinicalTag } from "@/features/monitoring-notes/types";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

const EMPTY_FORM = { name: "", color: "#4361ee" };

/** Hospital-admin curation of the tag catalogue — rename, recolor, delete.
 *  Separate from the type-to-create picker while logging a note (Phase 3),
 *  which stays the primary way tags come into existence day to day. */
export function ClinicalTagsTab() {
  const { org } = usePortal();
  const tagsQuery = useClinicalTags();
  const createTag = useCreateClinicalTag();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const tags = tagsQuery.data?.results ?? [];

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createTag.mutateAsync({ ...form, organization: org.id });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not add this tag."
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="mc-card-title">Clinical tags</div>
          <div className="mc-card-sub">
            Hospital-wide labels for contact notes — anyone can attach one while
            logging a note; only here to rename or remove
          </div>
        </div>
        <button className="mc-btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? (
            <X size={15} strokeWidth={2} />
          ) : (
            <Plus size={15} strokeWidth={2} />
          )}
          {showForm ? "Cancel" : "Add tag"}
        </button>
      </CardHeader>

      {showForm && (
        <CardBody>
          <form onSubmit={submitCreate}>
            <div className="mc-formgrid">
              <div>
                <label className="mc-label" htmlFor="new-tag-name">
                  Name <span className="mc-req">*</span>
                </label>
                <input
                  id="new-tag-name"
                  className="mc-input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Swelling"
                />
              </div>
              <div>
                <label className="mc-label" htmlFor="new-tag-color">
                  Color
                </label>
                <input
                  id="new-tag-color"
                  className="mc-input"
                  type="color"
                  style={{ height: 42, padding: 4 }}
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
            </div>

            {formError && (
              <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
                <AlertCircle size={15} strokeWidth={2} aria-hidden />
                {formError}
              </p>
            )}
            <button
              type="submit"
              className="mc-btn"
              style={{ marginTop: 14 }}
              disabled={createTag.isPending}
            >
              <Plus size={15} strokeWidth={2} aria-hidden />
              {createTag.isPending ? "Adding…" : "Add tag"}
            </button>
          </form>
        </CardBody>
      )}

      {tagsQuery.isPending && (
        <CardBody>
          <div className="mc-rows">
            <RowSkeleton count={3} variant="plain" />
          </div>
        </CardBody>
      )}

      {tagsQuery.isError && (
        <CardBody>
          <EmptyState
            icon={<Tag size={20} strokeWidth={1.9} aria-hidden />}
            title="Couldn't load clinical tags"
            text="This is a problem reaching the server, not an empty list. Refresh to try again."
          />
        </CardBody>
      )}

      {tagsQuery.isSuccess &&
        (tags.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Tag size={20} strokeWidth={1.9} aria-hidden />}
              title="No tags yet"
              text="Tags typed while logging a contact note will appear here too."
            />
          </CardBody>
        ) : (
          <div className="mc-rows">
            {tags.map((tag, index) => (
              <TagRow
                key={tag.id}
                tag={tag}
                index={index}
                editing={editingId === tag.id}
                onStartEdit={() => setEditingId(tag.id)}
                onStopEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        ))}
    </Card>
  );
}

function TagRow({
  tag,
  index,
  editing,
  onStartEdit,
  onStopEdit,
}: {
  tag: ClinicalTag;
  index: number;
  editing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const updateTag = useUpdateClinicalTag();
  const deleteTag = useDeleteClinicalTag();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [form, setForm] = useState({
    name: tag.name,
    color: tag.color ?? "#4361ee",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTag.mutate({ tagId: tag.id, input: form }, { onSuccess: onStopEdit });
  };

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mc-card"
        style={{ padding: 14, background: "var(--c-ground)" }}
      >
        <form onSubmit={submit}>
          <div className="mc-formgrid">
            <div>
              <label className="mc-label" htmlFor={`tag-name-${tag.id}`}>
                Name <span className="mc-req">*</span>
              </label>
              <input
                id={`tag-name-${tag.id}`}
                className="mc-input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mc-label" htmlFor={`tag-color-${tag.id}`}>
                Color
              </label>
              <input
                id={`tag-color-${tag.id}`}
                className="mc-input"
                type="color"
                style={{ height: 42, padding: 4 }}
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
          </div>

          {updateTag.isError && (
            <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
              {updateTag.error instanceof Error
                ? updateTag.error.message
                : "Could not save this tag."}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              onClick={onStopEdit}
              disabled={updateTag.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="mc-btn mc-btn-sm"
              disabled={updateTag.isPending}
            >
              {updateTag.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mc-row"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
    >
      <span
        aria-hidden
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: tag.color ?? "var(--c-border)",
          flexShrink: 0,
        }}
      />
      <div className="mc-row-main">
        <div className="mc-row-title">{tag.name}</div>
      </div>
      <div className="mc-row-actions">
        {!confirmingDelete ? (
          <>
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
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 size={13} strokeWidth={2} aria-hidden /> Remove
            </button>
          </>
        ) : (
          <>
            <span className="mc-hint">Remove this tag?</span>
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleteTag.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mc-btn mc-btn-sm"
              style={{ background: "var(--c-high)" }}
              disabled={deleteTag.isPending}
              onClick={() => deleteTag.mutate(tag.id)}
            >
              {deleteTag.isPending ? "Removing…" : "Confirm"}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
