"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Pencil,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/layout";
import {
  useClinicalTags,
  useCreateClinicalTag,
  useDeleteClinicalTag,
  useUpdateClinicalTag,
} from "@/features/monitoring-notes/hooks/useMonitoringNotes";
import type { ClinicalTag } from "@/features/monitoring-notes/types";
import { ActionMenu, ActionMenuItem } from "@/shared/ui/ActionMenu";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

const DEFAULT_COLOR = "#4361ee";

const PRESET_COLORS = ["#1f9254", "#f0972b", "#c0392b", "#31b6d6", "#26333f"];

/**
 * Hospital-admin curation of the tag catalogue — rename, recolor, remove.
 * Separate from the type-to-create picker while logging a note (Phase 3),
 * which stays the primary way tags come into existence day to day.
 *
 * Laid out like the reference platform's own "Statuses" screen (search +
 * Create button above a table, a colored pill per row, a 3-dot Actions
 * menu). One deliberate gap: `ClinicalTag`
 * (`core/monitoring/api/serializers.py`) is `id, name, color, organization,
 * location, created_at, updated_at` — there is no `description` column on
 * the model at all. The Description field/column below is real UI, but
 * nothing typed into it is sent anywhere or saved — see the honest hint in
 * `TagFormModal` and the stub in the table. Worth a backend ask to Ahmed if
 * this is wanted for real; not silently faked here.
 */
export function ClinicalTagsTab() {
  const tagsQuery = useClinicalTags();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const tags = tagsQuery.data?.results ?? [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? tags.filter((t) => t.name.toLowerCase().includes(q)) : tags;
  }, [tags, search]);

  return (
    <>
      <Card>
        {tagsQuery.isSuccess && (
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
                placeholder="Search tags…"
                aria-label="Search clinical tags"
              />
            </div>

            <button className="mc-btn" onClick={() => setShowCreate(true)}>
              <Plus size={15} strokeWidth={2} aria-hidden />
              Create tag
            </button>
          </div>
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
              icon={<TagIcon size={20} strokeWidth={1.9} aria-hidden />}
              title="Couldn't load clinical tags"
              text="This is a problem reaching the server, not an empty list. Refresh to try again."
            />
          </CardBody>
        )}

        {tagsQuery.isSuccess &&
          (rows.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<TagIcon size={20} strokeWidth={1.9} aria-hidden />}
                title={tags.length === 0 ? "No tags yet" : "No tags match"}
                text={
                  tags.length === 0
                    ? "Tags typed while logging a contact note will appear here too."
                    : "Try a different search term."
                }
              />
            </CardBody>
          ) : (
            <div className="mc-dtable-wrap" style={{ marginTop: 14 }}>
              <table className="mc-dtable">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Description</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((tag) => (
                    <tr key={tag.id} className="mc-dtable-row">
                      <td>
                        <TagPill tag={tag} />
                      </td>
                      <td
                        className="mc-dtable-sub"
                        title="Not yet available — ClinicalTag has no description field on the backend yet"
                      >
                        —
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <TagActionMenu tag={tag} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </Card>

      <TagFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}

function TagPill({ tag }: { tag: ClinicalTag }) {
  const color = tag.color ?? DEFAULT_COLOR;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        color,
        background: `${color}1a`,
        border: `1px solid ${color}55`,
      }}
    >
      {tag.name}
    </span>
  );
}

function TagActionMenu({ tag }: { tag: ClinicalTag }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <ActionMenu label="Tag actions">
        <ActionMenuItem
          icon={<Pencil size={13} strokeWidth={2} aria-hidden />}
          label="Edit"
          onClick={() => setShowEdit(true)}
        />
        <ActionMenuItem
          icon={<Trash2 size={13} strokeWidth={2} aria-hidden />}
          label="Remove"
          danger
          onClick={() => setShowDelete(true)}
        />
      </ActionMenu>

      <TagFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        tag={tag}
      />
      <DeleteTagModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        tag={tag}
      />
    </div>
  );
}

/** Shared create/edit modal — editing an existing tag when `tag` is passed,
 *  creating a new one otherwise. */
function TagFormModal({
  open,
  onClose,
  tag,
}: {
  open: boolean;
  onClose: () => void;
  tag?: ClinicalTag;
}) {
  const { org } = usePortal();
  const createTag = useCreateClinicalTag();
  const updateTag = useUpdateClinicalTag();
  const isEdit = !!tag;

  // `description` is deliberately local-only — see the module docblock
  // above. It's never read on submit.
  const [form, setForm] = useState({
    name: tag?.name ?? "",
    description: "",
    color: tag?.color ?? DEFAULT_COLOR,
  });
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm({
        name: tag?.name ?? "",
        description: "",
        color: tag?.color ?? DEFAULT_COLOR,
      });
      setError(null);
    }
  }

  const pending = createTag.isPending || updateTag.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateTag.mutateAsync({
          tagId: tag.id,
          input: { name: form.name, color: form.color },
        });
      } else {
        await createTag.mutateAsync({
          name: form.name,
          color: form.color,
          organization: org.id,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this tag.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit tag" : "Create tag"}
      subtitle={
        isEdit
          ? "Update this tag's name and color"
          : "Define a reusable label for your organization"
      }
      icon={<TagIcon size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <label className="mc-label" htmlFor="tag-form-name">
            Tag Name <span className="mc-req">*</span>
          </label>
          <input
            id="tag-form-name"
            className="mc-input"
            required
            maxLength={30}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Swelling, Follow-up needed"
          />
          <div className="mc-hint" style={{ textAlign: "right", marginTop: 4 }}>
            {form.name.length}/30
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="mc-label" htmlFor="tag-form-description">
            Description
          </label>
          <textarea
            id="tag-form-description"
            className="mc-input"
            rows={3}
            maxLength={100}
            style={{ resize: "vertical" }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what this tag is for…"
          />
          <div className="mc-hint" style={{ textAlign: "right", marginTop: 4 }}>
            {form.description.length}/100
          </div>
          <p className="mc-hint" style={{ marginTop: -2 }}>
            Not saved yet — there&apos;s no description field on the backend tag
            model. This box is a preview of where one would go.
          </p>
        </div>

        <div>
          <label className="mc-label">
            Color <span className="mc-req">*</span>
          </label>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {PRESET_COLORS.map((c) => {
              const selected = form.color.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={selected}
                  onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: c,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: selected
                      ? `0 0 0 2px var(--c-card), 0 0 0 4px ${c}`
                      : "none",
                  }}
                >
                  {selected && (
                    <Check size={14} strokeWidth={3} color="#fff" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
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
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create tag"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteTagModal({
  open,
  onClose,
  tag,
}: {
  open: boolean;
  onClose: () => void;
  tag: ClinicalTag;
}) {
  const deleteTag = useDeleteClinicalTag();

  return (
    <Modal open={open} onClose={onClose} title="Remove tag" subtitle={tag.name}>
      <p className="mc-hint">
        This removes the tag from the catalogue and from every note it&apos;s
        attached to. This can&apos;t be undone.
      </p>

      {deleteTag.isError && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
          {deleteTag.error instanceof Error
            ? deleteTag.error.message
            : "Could not remove this tag."}
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
          disabled={deleteTag.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn"
          style={{ background: "var(--c-high)" }}
          disabled={deleteTag.isPending}
          onClick={() => deleteTag.mutate(tag.id, { onSuccess: onClose })}
        >
          {deleteTag.isPending ? "Removing…" : "Confirm remove"}
        </button>
      </div>
    </Modal>
  );
}
