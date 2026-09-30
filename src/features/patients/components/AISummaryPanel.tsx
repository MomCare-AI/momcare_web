"use client";

import { AlertCircle, FileText, Sparkles } from "lucide-react";

import { useAISummary } from "@/features/patients/hooks/usePatients";
import type { AISummaryCitation } from "@/features/patients/types";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";

interface Props {
  patientId: string;
  /** Jumps to the Readings tab — the honest destination for a "reading"
   *  citation. There's no per-staff profile page anywhere in the portal,
   *  so a "staff" citation is highlighted the same way but isn't a link
   *  to anywhere. */
  onViewReadings?: () => void;
}

interface ContentSegment {
  text: string;
  citation?: AISummaryCitation;
}

/**
 * Splits the summary's prose at each citation's own substring, so the
 * cited value/name can be highlighted inline exactly where it already
 * appears in the sentence — rather than repeating it in a separate list
 * below. Only the first occurrence of a given citation's text is matched;
 * overlapping matches are dropped rather than risk highlighting the wrong
 * span.
 */
function splitByCitations(
  content: string,
  citations: AISummaryCitation[]
): ContentSegment[] {
  if (citations.length === 0) return [{ text: content }];

  const matches = citations
    .map((citation) => {
      const start = citation.text ? content.indexOf(citation.text) : -1;
      return start === -1
        ? null
        : { start, end: start + citation.text.length, citation };
    })
    .filter(
      (m): m is { start: number; end: number; citation: AISummaryCitation } =>
        m !== null
    )
    .sort((a, b) => a.start - b.start);

  const segments: ContentSegment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue; // overlaps the previous match — skip
    if (m.start > cursor)
      segments.push({ text: content.slice(cursor, m.start) });
    segments.push({
      text: content.slice(m.start, m.end),
      citation: m.citation,
    });
    cursor = m.end;
  }
  if (cursor < content.length) segments.push({ text: content.slice(cursor) });
  return segments;
}

/**
 * The cached AI Summary (`GET /api/patients/{id}/ai-summary/`) — read-only,
 * on purpose. There is no "Regenerate" button anywhere in this panel: the
 * backend refreshes this on its own triggers (enrollment, every new
 * reading, a periodic cron, deactivation) — see
 * backend/docs/design/2026-09-27-ai-summary-design.md's Triggers section.
 * A manual-refresh button here would be an uncontrolled path to a paid API
 * call with no rate limit, which is exactly what that design avoided.
 *
 * 404 means "no summary generated yet" — a real, expected state for a very
 * new patient before the enrollment trigger has run, rendered as its own
 * empty state, never as an error. A genuine fetch failure gets its own
 * distinct message — this portal's own rule is that "nothing to show" and
 * "we couldn't find out" must never look the same.
 *
 * Citations highlight inline, in place, rather than as a separate list —
 * each one is a real value/name the content already mentions, computed
 * once at generation time by the backend's own `_build_citations()`; a
 * value the text never mentions simply produces no citation, never a
 * guessed one.
 */
export function AISummaryPanel({ patientId, onViewReadings }: Props) {
  const summaryQuery = useAISummary(patientId);

  return (
    <Card>
      <CardHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            className="mc-card-title"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <FileText size={16} strokeWidth={1.9} aria-hidden />
            AI Summary
          </div>
          <span className="mc-badge mc-badge-info">AI Insights</span>
        </div>
      </CardHeader>
      <CardBody>
        {summaryQuery.isPending ? (
          <p className="mc-hint">Loading…</p>
        ) : summaryQuery.isError ? (
          <EmptyState
            icon={<AlertCircle size={18} strokeWidth={1.9} aria-hidden />}
            title="AI summary unavailable"
            text="This is not a statement that no summary exists — it could not be loaded. Refresh to try again."
          />
        ) : summaryQuery.data === null ? (
          <EmptyState
            icon={<Sparkles size={18} strokeWidth={1.9} aria-hidden />}
            title="No summary yet"
            text="One is generated automatically once there's data to summarize — this refreshes on its own, there's nothing to trigger here."
          />
        ) : (
          <div className="mc-ai">
            <p
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.55,
                fontSize: 13,
                margin: 0,
              }}
            >
              {splitByCitations(
                summaryQuery.data.content,
                summaryQuery.data.citations
              ).map((segment, i) => {
                if (!segment.citation) return segment.text;

                // Only a reading citation has somewhere real to go (the
                // Readings tab) — underlined, like a link. A staff citation
                // is still a real, backend-verified mention, just not one
                // this portal has a profile page to send anyone to, so it's
                // highlighted (color + weight) without implying it's
                // clickable.
                if (segment.citation.type === "reading" && onViewReadings) {
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={onViewReadings}
                      style={{
                        color: "#1d4e85",
                        background: "#dbe9fa",
                        textDecoration: "underline",
                        textDecorationColor: "#5f92c9",
                        textUnderlineOffset: 2,
                        fontWeight: 700,
                        border: "none",
                        borderRadius: 4,
                        padding: "1px 4px",
                        margin: "0 1px",
                        font: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {segment.text}
                    </button>
                  );
                }
                return (
                  <span
                    key={i}
                    style={{
                      color: "#1d4e85",
                      background: "#eef1ff",
                      fontWeight: 700,
                      borderRadius: 4,
                      padding: "1px 4px",
                      margin: "0 1px",
                    }}
                  >
                    {segment.text}
                  </span>
                );
              })}
            </p>
            <p className="mc-ai-note">
              Decision support only — never a diagnosis. Generated{" "}
              {formatDateTime(summaryQuery.data.generated_at)} using{" "}
              {summaryQuery.data.model_used}
              {summaryQuery.data.citations.length > 0 &&
                " · underlined values link to their reading, highlighted names are real mentions from the care team."}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
