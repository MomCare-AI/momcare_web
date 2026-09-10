"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Brain,
  Check,
  Microscope,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  useReassessRisk,
  useRiskHistory,
  useVerifyRisk,
} from "../hooks/useMonitoring";
import {
  assessmentCategories,
  assessmentSource,
  riskLabel,
  type RiskAssessment,
  type RiskLevel,
} from "../types";
import { useOrganization } from "@/features/portal/hooks/usePortalData";
import { RiskBadge } from "./RiskBadge";
import { RiskAssessmentModal } from "./RiskAssessmentModal";

interface Props {
  pregnancyId: string;
  patientName?: string;
  /** Only a clinician may review an assessment — the server enforces it too. */
  canVerify?: boolean;
}

const LEVELS: RiskLevel[] = ["low", "medium", "high"];

/**
 * What the model currently makes of this pregnancy, and why.
 *
 * Three things this panel refuses to do: show a level without the vitals
 * behind it, present the model's raw answer as the one the system acted on,
 * and let an unreviewed high assessment look the same as one a clinician has
 * actually judged.
 */
export function RiskPanel({
  pregnancyId,
  patientName = "Patient",
  canVerify = true,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const risk = useRiskHistory(pregnancyId);
  const verify = useVerifyRisk(pregnancyId);
  const reassess = useReassessRisk(pregnancyId);

  // Same cached query the portal shell already holds, so this is a second
  // reader rather than a second request.
  const org = useOrganization();
  const threshold = org.data
    ? Math.round(Number(org.data.effective_confidence_threshold) * 100)
    : null;

  const current = risk.data?.current ?? null;
  const history = risk.data?.history ?? [];

  return (
    <>
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
            {/* final_risk_level, not risk_level: this is the level the
                alerting layer acted on, so it is the only honest badge. */}
            {current && <RiskBadge level={current.final_risk_level} />}
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              onClick={() => setShowModal(true)}
              title="Score a set of vitals through the model"
            >
              <Microscope size={13} strokeWidth={2} aria-hidden />
              Test AI
            </button>
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
        ) : risk.isError ? (
          <div className="mc-empty">
            <span className="mc-empty-title">Assessment unavailable</span>
            <span className="mc-empty-text">
              This could not be loaded, so it is not a statement that the
              patient is low risk. Refresh to try again.
            </span>
          </div>
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
              <CategoryList assessment={current} />

              {/* The model was trained region-blind, so an Africa-region
                  Medium is escalated before anything acts on it. Saying so
                  keeps the badge from contradicting the stated confidence. */}
              {current.final_risk_level !== current.risk_level && (
                <p className="mc-note-line">
                  The model returned{" "}
                  <strong>{riskLabel(current.risk_level)}</strong>; this
                  hospital&rsquo;s population adjustment raised it to{" "}
                  <strong>{riskLabel(current.final_risk_level)}</strong>, which
                  is the level acted on.
                </p>
              )}

              {current.previous_risk_level &&
                current.previous_risk_level !== current.final_risk_level && (
                  <p className="mc-note-line">
                    Changed from{" "}
                    <strong>{riskLabel(current.previous_risk_level)}</strong> to{" "}
                    <strong>{riskLabel(current.final_risk_level)}</strong> on{" "}
                    {new Date(current.assessed_at).toLocaleString()}.
                  </p>
                )}

              {current.flagged_for_review && (
                <p className="mc-alert mc-alert-notice">
                  <AlertTriangle size={14} strokeWidth={2} aria-hidden />
                  {/* The threshold is a separate fetch by design — the risk
                      endpoint deliberately does not carry it. Naming both
                      numbers turns "flagged" from a verdict into something a
                      clinician can actually judge. */}
                  The model was{" "}
                  {current.confidence
                    ? `${Math.round(Number(current.confidence) * 100)}% sure`
                    : "not sure enough"}
                  {threshold !== null &&
                    `, below this hospital's ${threshold}%`}
                  . The result stands, but a clinician should look again.
                </p>
              )}

              {reassess.data?.detail && !reassess.data.changed && (
                <p className="mc-note-line">{reassess.data.detail}</p>
              )}

              <div className="mc-ai">
                <span className="mc-ai-tag">
                  <Brain size={12} strokeWidth={2.3} aria-hidden />
                  AI model
                </span>
                <p className="mc-ai-note">
                  Produced by the maternal risk model. Decision support only —
                  never a diagnosis, and always reviewed by a clinician.
                </p>
              </div>
            </div>

            <div className="mc-card-foot">
              <ReviewControl
                assessment={current}
                canVerify={canVerify}
                pending={verify.isPending}
                error={verify.error}
                onVerify={(confirmedLevel) =>
                  verify.mutate({ assessmentId: current.id, confirmedLevel })
                }
              />
            </div>
          </>
        )}

        {history.length > 1 && <RiskHistoryList history={history} />}
      </section>

      {showModal && (
        <RiskAssessmentModal
          pregnancyId={pregnancyId}
          patientName={patientName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

/**
 * The per-vital categories the model reported.
 *
 * A blank category means the vital was not measured, which is not the same as
 * normal — those rows are dropped rather than rendered as reassurance.
 */
function CategoryList({ assessment }: { assessment: RiskAssessment }) {
  const categories = assessmentCategories(assessment);

  if (categories.length === 0) {
    return (
      <p className="mc-note-line">
        No per-vital breakdown was recorded with this assessment. That says the
        model did not report categories — not that every vital was in range.
      </p>
    );
  }

  return (
    <ul className="mc-findings">
      {categories.map(({ label, value }) => (
        <li key={label} className="mc-finding">
          <span className="mc-finding-mark" aria-hidden />
          <span>
            <strong>{label}:</strong> {value}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A clinician agreeing with the model, or correcting it.
 *
 * There is no bare "acknowledge": the server requires a level, and derives
 * confirmed-vs-corrected by comparing it to what the model said. A button
 * that only marked the row as seen would let the queue look attended to
 * without anyone having decided anything.
 */
function ReviewControl({
  assessment,
  canVerify,
  pending,
  error,
  onVerify,
}: {
  assessment: RiskAssessment;
  canVerify: boolean;
  pending: boolean;
  error: unknown;
  onVerify: (level: RiskLevel) => void;
}) {
  const [correcting, setCorrecting] = useState(false);
  const [level, setLevel] = useState<RiskLevel>(assessment.final_risk_level);

  if (assessment.verified_at) {
    return (
      <span className="mc-foot-note">
        {assessment.review_status_display} by{" "}
        {assessment.verified_by_name || "a clinician"} on{" "}
        {new Date(assessment.verified_at).toLocaleString()}
        {assessment.confirmed_risk_level &&
          assessment.confirmed_risk_level !== assessment.final_risk_level &&
          ` — corrected to ${riskLabel(assessment.confirmed_risk_level)}`}
      </span>
    );
  }

  if (!assessment.needs_review) {
    return (
      <span className="mc-foot-note">
        Assessed {new Date(assessment.assessed_at).toLocaleString()}
      </span>
    );
  }

  if (!canVerify) {
    return (
      <span className="mc-foot-note">
        Awaiting clinical review — assessed{" "}
        {new Date(assessment.assessed_at).toLocaleString()}
      </span>
    );
  }

  return (
    <div>
      <div className="mc-row-actions">
        {correcting ? (
          <>
            <select
              className="mc-input mc-input-sm"
              aria-label="Corrected risk level"
              value={level}
              onChange={(e) => setLevel(e.target.value as RiskLevel)}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {riskLabel(l)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="mc-btn mc-btn-sm"
              onClick={() => onVerify(level)}
              disabled={pending}
            >
              <Check size={14} strokeWidth={2.2} aria-hidden />
              {pending ? "Recording…" : "Record my judgement"}
            </button>
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              onClick={() => setCorrecting(false)}
              disabled={pending}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="mc-btn mc-btn-sm"
              onClick={() => onVerify(assessment.final_risk_level)}
              disabled={pending}
            >
              <Check size={14} strokeWidth={2.2} aria-hidden />
              {pending
                ? "Recording…"
                : `Confirm ${riskLabel(assessment.final_risk_level)}`}
            </button>
            <button
              type="button"
              className="mc-btn-ghost mc-btn-sm"
              onClick={() => setCorrecting(true)}
              disabled={pending}
            >
              Disagree — correct it
            </button>
          </>
        )}
      </div>

      {error instanceof Error && (
        <p className="mc-alert mc-alert-error" style={{ marginTop: 10 }}>
          <AlertTriangle size={14} strokeWidth={2} aria-hidden />
          {error.message}
        </p>
      )}
    </div>
  );
}

/**
 * Past transitions.
 *
 * Only changes are stored, so this reads as a clinical narrative rather than a
 * log — "became high at 14:32, recovered at 19:05" — which is exactly what
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
            <RiskBadge level={entry.final_risk_level} />
            <span className="mc-timeline-when">
              {new Date(entry.assessed_at).toLocaleString()}
            </span>
            <span className="mc-timeline-why">
              {assessmentCategories(entry)[0]?.value ?? "Returned to range."}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
