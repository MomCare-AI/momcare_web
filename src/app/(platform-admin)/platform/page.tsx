"use client";

import { useState } from "react";
import { AlertCircle, Check, FileText, Plus, Sparkles } from "lucide-react";

import {
  useActivateSummaryTemplate,
  useAIProviderConfig,
  useCreateSummaryTemplate,
  useReviewSummaryTemplate,
  useSummaryTemplates,
} from "@/features/platform-ai/hooks/usePlatformAI";
import type {
  AISummaryTemplate,
  TemplateReviewResult,
} from "@/features/platform-ai/types";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

export default function PlatformAISummaryTemplatesPage() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const templatesQuery = useSummaryTemplates(page);
  const activate = useActivateSummaryTemplate();

  const templates = templatesQuery.data?.results ?? [];
  const active = templates.find((t) => t.is_active);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="mc-h1">AI Summary Templates</h1>
          <p className="mc-sub" style={{ marginTop: 4 }}>
            The plain-language guidance that shapes every patient&rsquo;s AI
            Summary, platform-wide. Exactly one template is active at a time —
            writing a new one replaces it immediately.
          </p>
        </div>
        <button className="mc-btn" onClick={() => setShowCreate(true)}>
          <Plus size={15} strokeWidth={2} aria-hidden />
          Write new template
        </button>
      </div>

      {active && (
        <Card style={{ marginBottom: 20 }}>
          <CardHeader>
            <div>
              <div className="mc-card-title">
                <Sparkles
                  size={15}
                  strokeWidth={1.9}
                  style={{ verticalAlign: -2, marginRight: 6 }}
                  aria-hidden
                />
                Active template
              </div>
              <div className="mc-card-sub">
                {active.word_count} words · written by{" "}
                {active.created_by_name || "—"} ·{" "}
                {active.activated_at
                  ? new Date(active.activated_at).toLocaleString()
                  : "—"}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 13.5 }}>
              {active.content}
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="mc-card-title">
            <FileText
              size={15}
              strokeWidth={1.9}
              style={{ verticalAlign: -2, marginRight: 6 }}
              aria-hidden
            />
            History
          </div>
        </CardHeader>

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
          (templates.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<FileText size={20} strokeWidth={1.9} aria-hidden />}
                title="No templates yet"
                text="Write the first one — it becomes active the moment it's saved."
              />
            </CardBody>
          ) : (
            <div className="mc-rows" style={{ padding: "0 20px 20px" }}>
              {templates.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  onActivate={() => activate.mutate(t.id)}
                  activating={activate.isPending && activate.variables === t.id}
                />
              ))}
            </div>
          ))}

        {templatesQuery.data && templatesQuery.data.total_pages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              padding: "0 20px 20px",
            }}
          >
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              disabled={!templatesQuery.data.previous}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="mc-pager-label">
              Page {templatesQuery.data.page} of{" "}
              {templatesQuery.data.total_pages}
            </span>
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              disabled={!templatesQuery.data.next}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </Card>

      <CreateTemplateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </>
  );
}

function TemplateRow({
  template,
  onActivate,
  activating,
}: {
  template: AISummaryTemplate;
  onActivate: () => void;
  activating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = template.content.length > 160;

  return (
    <div className="mc-row" style={{ cursor: "pointer", flexWrap: "wrap" }}>
      <div className="mc-row-main" onClick={() => setExpanded((v) => !v)}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div className="mc-row-title">
            {new Date(template.created_at).toLocaleString()}
          </div>
          {template.is_active && (
            <span className="mc-badge mc-badge-stable">Active</span>
          )}
          <span className="mc-row-meta">{template.word_count} words</span>
        </div>
        <div className="mc-row-meta" style={{ marginTop: 4 }}>
          {expanded || !long
            ? template.content
            : `${template.content.slice(0, 160)}…`}
          {long && (
            <button
              type="button"
              className="mc-link"
              style={{ marginLeft: 6, display: "inline" }}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>
      {!template.is_active && (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            disabled={activating}
            onClick={onActivate}
          >
            <Check size={13} strokeWidth={2} aria-hidden />
            {activating ? "Activating…" : "Activate"}
          </button>
        </div>
      )}
    </div>
  );
}

function CreateTemplateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const configQuery = useAIProviderConfig();
  const review = useReviewSummaryTemplate();
  const create = useCreateSummaryTemplate();

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [reviewResult, setReviewResult] = useState<TemplateReviewResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setContent("");
      setReviewResult(null);
      setError(null);
    }
  }

  const wordLimit = configQuery.data?.max_words ?? 130;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > wordLimit;

  const runReview = async () => {
    setError(null);
    setReviewResult(null);
    try {
      const result = await review.mutateAsync(content);
      setReviewResult(result);
      if (result.complete && result.enhanced_content) {
        setContent(result.enhanced_content);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not review this template."
      );
    }
  };

  const save = async () => {
    setError(null);
    try {
      await create.mutateAsync({ name: name.trim(), content: content.trim() });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this template."
      );
    }
  };

  const canSave = reviewResult?.complete === true && !overLimit;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Write new template"
      subtitle="Plain-language guidance for the AI Summary — review it before saving"
      icon={<Sparkles size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <div style={{ marginBottom: 16 }}>
        <label className="mc-label" htmlFor="template-name">
          Name <span className="mc-req">*</span>
        </label>
        <input
          id="template-name"
          className="mc-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Standard patient summary"
        />
      </div>

      <div style={{ marginBottom: 6 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <label
            className="mc-label"
            htmlFor="template-content"
            style={{ margin: 0 }}
          >
            Guidance <span className="mc-req">*</span>
          </label>
          <span
            className="mc-hint"
            style={{ color: overLimit ? "var(--c-high-text)" : undefined }}
          >
            {wordCount} / {wordLimit} words
          </span>
        </div>
        <textarea
          id="template-content"
          className="mc-input"
          rows={8}
          style={{ resize: "vertical" }}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setReviewResult(null);
          }}
          placeholder="Describe what the summary should say and in what order — e.g. 'Start with her name and gestational age, then the current risk level...'"
        />
      </div>

      <button
        type="button"
        className="mc-btn-ghost mc-btn-sm"
        disabled={!content.trim() || overLimit || review.isPending}
        onClick={runReview}
      >
        {review.isPending ? "Reviewing…" : "Review"}
      </button>

      {reviewResult && !reviewResult.complete && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 14 }}>
          <AlertCircle size={15} strokeWidth={2} aria-hidden />
          {reviewResult.message ??
            "This draft is missing some required details."}
        </p>
      )}

      {reviewResult?.complete && (
        <div
          className="mc-card"
          style={{
            marginTop: 14,
            padding: 14,
            background: "var(--c-ground)",
          }}
        >
          <div className="mc-card-sub" style={{ marginBottom: 8 }}>
            Sample preview (made-up patient — never real data)
          </div>
          <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 13 }}>
            {reviewResult.preview_text ??
              "Wording was polished, but a live preview couldn't be generated right now — this won't block saving."}
          </p>
        </div>
      )}

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
          disabled={create.isPending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="mc-btn"
          disabled={!name.trim() || !canSave || create.isPending}
          onClick={save}
          title={
            !canSave
              ? "Review the draft and resolve any missing details first"
              : undefined
          }
        >
          {create.isPending ? "Saving…" : "Save and activate"}
        </button>
      </div>
    </Modal>
  );
}
