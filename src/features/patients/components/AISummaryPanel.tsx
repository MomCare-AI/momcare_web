"use client";

import { AlertCircle, Brain, Sparkles } from "lucide-react";

import { useAISummary } from "@/features/patients/hooks/usePatients";
import { formatDateTime } from "@/shared/lib/formatDateTime";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";

interface Props {
  patientId: string;
}

/**
 * The cached AI Summary (`GET /api/patients/{id}/ai-summary/`) — read-only,
 * on purpose. There is no "Regenerate" button anywhere in this panel: the
 * backend refreshes this on its own four triggers (enrollment, a risk-level
 * change, a periodic cron, deactivation) — see
 * backend/docs/design/2026-09-27-ai-summary-design.md's Triggers section.
 * A manual-refresh button here would be an uncontrolled path to a paid API
 * call with no rate limit, which is exactly what that design avoided.
 *
 * 404 means "no summary generated yet" — a real, expected state for a very
 * new patient before the enrollment trigger has run, rendered as its own
 * empty state, never as an error. A genuine fetch failure gets its own
 * distinct message — this portal's own rule is that "nothing to show" and
 * "we couldn't find out" must never look the same.
 */
export function AISummaryPanel({ patientId }: Props) {
  const summaryQuery = useAISummary(patientId);

  return (
    <Card style={{ marginTop: 18 }}>
      <CardHeader>
        <div className="mc-card-title">AI Summary</div>
        <div className="mc-card-sub">
          A narrative generated from this patient's own vitals, notes and care
          team.
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
          <>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {summaryQuery.data.content}
            </p>
            {summaryQuery.data.citations.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--c-faint)",
                    marginBottom: 8,
                  }}
                >
                  Sources
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {summaryQuery.data.citations.map((c, i) => (
                    <span
                      key={`${c.type}-${c.id}-${i}`}
                      className={
                        c.type === "staff"
                          ? "mc-badge mc-badge-info"
                          : "mc-badge mc-badge-neutral"
                      }
                    >
                      {c.text}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mc-ai" style={{ marginTop: 14 }}>
              <span className="mc-ai-tag">
                <Brain size={12} strokeWidth={2.3} aria-hidden />
                AI Summary
              </span>
              <p className="mc-ai-note">
                Decision support only — never a diagnosis. Generated{" "}
                {formatDateTime(summaryQuery.data.generated_at)} using{" "}
                {summaryQuery.data.model_used}.
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
