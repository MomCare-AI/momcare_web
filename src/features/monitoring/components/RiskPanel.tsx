"use client";

import {
  Brain,
  Check,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import {
  useAcknowledgeRisk,
  useReassessRisk,
  useRiskHistory,
} from "../hooks/useMonitoring";
import { assessmentSource, riskLabel, type RiskAssessment } from "../types";
import { RiskBadge } from "./RiskBadge";

interface Props {
  pregnancyId: string;
}

/**
 * What the scoring engine currently makes of this pregnancy, and why.
 *
 * Three things this panel refuses to do: show a level without the readings
 * behind it, present the rules engine as if it were the AI model, and let an
 * unreviewed critical assessment look the same as one a clinician has seen.
 */
export function RiskPanel({ pregnancyId }: Props) {
  const risk = useRiskHistory(pregnancyId);
  const acknowledge = useAcknowledgeRisk(pregnancyId);
  const reassess = useReassessRisk(pregnancyId);

  const current = risk.data?.current ?? null;
  const history = risk.data?.history ?? [];

  return (
    <section className="mc-card">
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Risk assessment</div>
          <div className="mc-card-sub">
            {current
              ? assessmentSource(current)
              : "Decision support, reviewed by a clinician"}
          </div>
        </div>
        <div className="mc-row-actions">
          {current && <RiskBadge level={current.level} />}
          <button
            type="button"
            className="mc-btn-ghost mc-btn-sm"
            onClick={() => reassess.mutate()}
            disabled={reassess.isPending}
          >
            <RefreshCw size={13} strokeWidth={2} aria-hidden />
            {reassess.isPending ? "Scoring…" : "Re-score"}
          </button>
        </div>
      </div>

      {risk.isPending ? (
        <div className="mc-empty">Loading assessment…</div>
      ) : !current ? (
        <div className="mc-empty">
          <span className="mc-empty-icon">
            <ShieldCheck size={20} strokeWidth={1.9} aria-hidden />
          </span>
          <span className="mc-empty-title">Not assessed yet</span>
          <span className="mc-empty-text">
            Risk is scored the moment a reading arrives. Record a vital or
            assign a wearable band, and the first assessment will appear here.
          </span>
        </div>
      ) : (
        <>
          <div className="mc-card-body">
            {current.reasons.length === 0 ? (
              <p className="mc-note-line">
                No findings from the latest readings. This says the measurements
                on file are within range — not that the patient has been
                examined.
              </p>
            ) : (
              <ul className="mc-findings">
                {current.findings.map((finding) => (
                  <li
                    key={finding.code}
                    className={`mc-finding is-${finding.level}`}
                  >
                    <span className="mc-finding-mark" aria-hidden />
                    <span>{finding.detail}</span>
                  </li>
                ))}
              </ul>
            )}

            {current.previous_level &&
              current.previous_level !== current.level && (
                <p className="mc-note-line">
                  Changed from{" "}
                  <strong>{riskLabel(current.previous_level)}</strong> to{" "}
                  <strong>{riskLabel(current.level)}</strong> on{" "}
                  {new Date(current.assessed_at).toLocaleString()}.
                </p>
              )}

            {reassess.data?.detail && !reassess.data.changed && (
              <p className="mc-note-line">{reassess.data.detail}</p>
            )}

            <div className="mc-ai">
              <span className="mc-ai-tag">
                {current.source === "model" ? (
                  <>
                    <Brain size={12} strokeWidth={2.3} aria-hidden />
                    AI model
                  </>
                ) : (
                  <>
                    <Stethoscope size={12} strokeWidth={2.3} aria-hidden />
                    Clinical rules
                  </>
                )}
              </span>
              <p className="mc-ai-note">
                {current.source === "model"
                  ? "Produced by the maternal risk model. Decision support only — never a diagnosis, and always reviewed by a clinician."
                  : "Produced by published obstetric thresholds, not a trained model. It indicates a clinician should look; it does not say what is wrong."}
              </p>
            </div>
          </div>

          <div className="mc-card-foot">
            {current.needs_acknowledgement ? (
              <button
                type="button"
                className="mc-btn mc-btn-sm"
                onClick={() => acknowledge.mutate(current.id)}
                disabled={acknowledge.isPending}
              >
                <Check size={14} strokeWidth={2.2} aria-hidden />
                {acknowledge.isPending
                  ? "Recording…"
                  : "Acknowledge — I have reviewed this"}
              </button>
            ) : current.acknowledged_at ? (
              <span className="mc-foot-note">
                Reviewed by {current.acknowledged_by_name || "a clinician"} on{" "}
                {new Date(current.acknowledged_at).toLocaleString()}
              </span>
            ) : (
              <span className="mc-foot-note">
                Assessed {new Date(current.assessed_at).toLocaleString()}
              </span>
            )}
          </div>
        </>
      )}

      {history.length > 1 && <RiskHistoryList history={history} />}
    </section>
  );
}

/**
 * Past transitions.
 *
 * Only changes are stored, so this reads as a clinical narrative rather than a
 * log — "became critical at 14:32, recovered at 19:05" — which is exactly what
 * someone picking up the case needs.
 */
function RiskHistoryList({ history }: { history: RiskAssessment[] }) {
  return (
    <div
      className="mc-card-body"
      style={{ borderTop: "1px solid var(--c-border-soft)" }}
    >
      <div className="mc-card-sub" style={{ marginBottom: 10 }}>
        Earlier changes
      </div>
      <ol className="mc-timeline">
        {history.slice(1).map((entry) => (
          <li key={entry.id} className="mc-timeline-row">
            <RiskBadge level={entry.level} />
            <span className="mc-timeline-when">
              {new Date(entry.assessed_at).toLocaleString()}
            </span>
            <span className="mc-timeline-why">
              {entry.reasons[0] ?? "Returned to range."}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
