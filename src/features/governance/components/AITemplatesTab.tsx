"use client";

import { useState } from "react";
import { AlertCircle, Brain, CheckCircle2, Plus, Sparkles } from "lucide-react";

import {
  useActivateSummaryTemplate,
  useCreateSummaryTemplate,
  useDeactivateSummaryTemplate,
  useEnhanceSummaryTemplateWording,
  useSummaryTemplates,
} from "@/features/ai-templates/hooks/useAITemplates";
import {
  TEMPLATE_FIELD_VOCABULARY,
  type AISummaryTemplate,
  type TemplateSection,
} from "@/features/ai-templates/types";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import { RowSkeleton } from "@/shared/ui/RowSkeleton";

function defaultSections(): TemplateSection[] {
  return [{ label: "Summary", fields: [...TEMPLATE_FIELD_VOCABULARY] }];
}

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * How this hospital's AI Summary is laid out and worded —
 * `GET/POST /api/organization/me/summary-templates/` (+ `/activate/`,
 * `/deactivate/`, `/enhance/`). A template only rearranges the fixed field
 * vocabulary the backend already collects into labeled sections, plus
 * optional extra wording; it can never introduce a fact. Entries are
 * immutable and never deleted — this is a history, not a CRUD list, and
 * "editing" means creating a new one and activating it. hospital_admin
 * only, matching the backend's own restriction.
 */
export function AITemplatesTab() {
  const templatesQuery = useSummaryTemplates();
  const activate = useActivateSummaryTemplate();
  const deactivate = useDeactivateSummaryTemplate();
  const [showCreate, setShowCreate] = useState(false);

  const templates = templatesQuery.data?.results ?? [];

  return (
    <>
      <Card>
        {templatesQuery.isSuccess && (
          <div className="mc-table-toolbar">
            <div>
              <div className="mc-card-title">AI Summary Templates</div>
              <div className="mc-card-sub">
                Controls how the AI Summary on a patient's Overview tab is
                arranged and worded. Decision support only — never a diagnosis.
              </div>
            </div>
            <button className="mc-btn" onClick={() => setShowCreate(true)}>
              <Plus size={15} strokeWidth={2} aria-hidden />
              New template
            </button>
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
          (templates.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={<Brain size={20} strokeWidth={1.9} aria-hidden />}
                title="No templates yet"
                text="Until one is created and activated here, patient AI Summaries use the platform's default layout and wording."
              />
            </CardBody>
          ) : (
            <div className="mc-rows" style={{ padding: "14px 20px 20px" }}>
              {templates.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  onActivate={() => activate.mutate(t.id)}
                  onDeactivate={() => deactivate.mutate(t.id)}
                  activatePending={
                    activate.isPending && activate.variables === t.id
                  }
                  deactivatePending={
                    deactivate.isPending && deactivate.variables === t.id
                  }
                />
              ))}
            </div>
          ))}
      </Card>

      <TemplateBuilderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </>
  );
}

function TemplateRow({
  template,
  onActivate,
  onDeactivate,
  activatePending,
  deactivatePending,
}: {
  template: AISummaryTemplate;
  onActivate: () => void;
  onDeactivate: () => void;
  activatePending: boolean;
  deactivatePending: boolean;
}) {
  return (
    <div className="mc-row" style={{ flexWrap: "wrap" }}>
      <div className="mc-row-main">
        <div
          className="mc-row-title"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {template.name}
          {template.is_active && (
            <span className="mc-badge mc-badge-stable">
              <CheckCircle2 size={12} strokeWidth={2} aria-hidden />
              Active
            </span>
          )}
        </div>
        <div className="mc-row-meta">
          {template.sections.length} section
          {template.sections.length === 1 ? "" : "s"}
          {template.extra_instructions_word_count > 0 &&
            ` · ${template.extra_instructions_word_count} words of extra instructions`}
        </div>
        <div className="mc-row-meta" style={{ marginTop: 4 }}>
          {template.created_by_name
            ? `${template.created_by_name} · ${timeAgo(template.created_at)}`
            : timeAgo(template.created_at)}
        </div>
      </div>
      {template.is_active ? (
        <button
          type="button"
          className="mc-btn-ghost"
          disabled={deactivatePending}
          onClick={onDeactivate}
        >
          {deactivatePending ? "Deactivating…" : "Deactivate"}
        </button>
      ) : (
        <button
          type="button"
          className="mc-btn-ghost"
          disabled={activatePending}
          onClick={onActivate}
        >
          {activatePending ? "Activating…" : "Activate"}
        </button>
      )}
    </div>
  );
}

function TemplateBuilderModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createTemplate = useCreateSummaryTemplate();
  const enhance = useEnhanceSummaryTemplateWording();

  const [name, setName] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    text: string | null;
    wordCount: number;
    wordLimit: number;
  } | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setExtraInstructions("");
      setError(null);
      setPreview(null);
    }
  }

  // The backend's `sections` field is a layout the fixed 17-field vocabulary
  // must be split across (see Postman's own "Vitals & Risk" / "Care Team &
  // Activity" example) -- but this hospital only ever asked to control the
  // wording, not the layout, so every template this form creates uses one
  // section holding all 17 fields in their fixed order. `sections` is still
  // sent (the API requires it), it's just never exposed here.
  const sections: TemplateSection[] = defaultSections();

  const runEnhance = async () => {
    setError(null);
    try {
      const result = await enhance.mutateAsync({
        sections,
        extra_instructions: extraInstructions,
      });
      setExtraInstructions(result.extra_instructions);
      setPreview({
        text: result.preview_text,
        wordCount: result.word_count,
        wordLimit: result.word_limit,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not enhance this wording."
      );
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createTemplate.mutateAsync({
        name,
        sections,
        extra_instructions: extraInstructions,
      });
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
      title="New AI Summary template"
      subtitle="A title and the wording every AI Summary built from this template should follow"
      icon={<Brain size={17} strokeWidth={2} aria-hidden />}
      tinted
    >
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <label className="mc-label" htmlFor="template-name">
            Title <span className="mc-req">*</span>
          </label>
          <input
            id="template-name"
            className="mc-input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Condensed style"
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <label
              className="mc-label"
              htmlFor="template-extra"
              style={{ margin: 0 }}
            >
              Summary template
            </label>
            <button
              type="button"
              className="mc-link"
              disabled={enhance.isPending}
              onClick={runEnhance}
            >
              <Sparkles
                size={13}
                strokeWidth={2}
                aria-hidden
                style={{ verticalAlign: "-2px", marginRight: 4 }}
              />
              {enhance.isPending ? "Enhancing…" : "Enhance"}
            </button>
          </div>
          <textarea
            id="template-extra"
            className="mc-input"
            rows={8}
            style={{ resize: "vertical" }}
            value={extraInstructions}
            onChange={(e) => setExtraInstructions(e.target.value)}
            placeholder="Write the wording guidance every AI Summary built from this template should follow, then optionally use Enhance to polish it"
          />
        </div>

        {preview && (
          <div className="mc-ai" style={{ marginTop: 4 }}>
            <span className="mc-ai-tag">
              <Brain size={12} strokeWidth={2.3} aria-hidden />
              Preview
            </span>
            <p className="mc-ai-note">
              {preview.wordCount}/{preview.wordLimit} words
              {preview.text
                ? ` — ${preview.text}`
                : " — preview unavailable, wording was still saved"}
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
            disabled={createTemplate.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="mc-btn"
            disabled={createTemplate.isPending}
          >
            <Plus size={15} strokeWidth={2} aria-hidden />
            {createTemplate.isPending ? "Saving…" : "Save template"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
