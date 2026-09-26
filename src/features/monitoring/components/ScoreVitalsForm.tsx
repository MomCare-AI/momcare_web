"use client";

import { useState } from "react";
import { AlertTriangle, Brain } from "lucide-react";

import { getRiskHistory } from "../api";
import { useRecordReading } from "../hooks/useMonitoring";
import {
  VITAL_FIELDS,
  assessmentCategories,
  assessmentSource,
  riskLabel,
  type NumericVital,
  type RiskAssessment,
} from "../types";
import { RiskBadge } from "./RiskBadge";
import { Pair } from "@/shared/ui/Pair";

interface Props {
  pregnancyId: string;
  patientName: string;
  onRecorded?: () => void;
}

/**
 * The reusable core of "record a reading, then show what the model made of
 * it" — shared by the AI Risk Assessment tab's own "Score vitals" card and
 * the Readings tab's "Add Reading" popup, so there is one scoring path and
 * one result display, not two that could drift apart. It writes a real
 * reading; there is no dry-run endpoint, so the vitals entered here become
 * part of the record and the result shown is the one the alerting layer
 * acted on.
 */
export function ScoreVitalsForm({
  pregnancyId,
  patientName,
  onRecorded,
}: Props) {
  const [values, setValues] = useState<Partial<Record<NumericVital, string>>>(
    {}
  );
  const [result, setResult] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const record = useRecordReading(pregnancyId);

  const set = (field: NumericVital, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const payload: Partial<Record<NumericVital, number>> = {};
    for (const { field } of VITAL_FIELDS) {
      const raw = values[field];
      if (raw === undefined || raw.trim() === "") continue;
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) payload[field] = parsed;
    }

    try {
      await record.mutateAsync(payload);
      // The create response carries the level but not the per-vital
      // breakdown, so the assessment itself is read back.
      const risk = await getRiskHistory(pregnancyId);
      if (risk.current === null) {
        setError(
          "The reading was recorded, but the model returned no assessment for it."
        );
        return;
      }
      setValues({});
      setResult(risk.current);
      onRecorded?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not score these vitals."
      );
    }
  };

  return (
    <>
      <p className="mc-alert mc-alert-notice" style={{ marginBottom: 16 }}>
        <AlertTriangle size={14} strokeWidth={2} aria-hidden />
        This records a real reading on {patientName}&rsquo;s chart — the same as
        entering vitals from the Vitals card. There is no test mode.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mc-formgrid">
          {VITAL_FIELDS.map(({ field, label, unit, step, placeholder }) => (
            <div key={field}>
              <label className="mc-label" htmlFor={`riskinput-${field}`}>
                {label} <span className="mc-unit">({unit})</span>
              </label>
              <input
                id={`riskinput-${field}`}
                className="mc-input"
                type="number"
                step={step}
                value={values[field] ?? ""}
                onChange={(e) => set(field, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="mc-alert mc-alert-error">
            <AlertTriangle size={14} strokeWidth={2} aria-hidden />
            {error}
          </p>
        )}

        <button type="submit" className="mc-btn" disabled={record.isPending}>
          <Brain size={14} strokeWidth={2} aria-hidden />
          {record.isPending ? "Scoring…" : "Record and score"}
        </button>
      </form>

      {result && <ScoreResult assessment={result} />}
    </>
  );
}

export function ScoreResult({
  assessment,
  compact = false,
}: {
  assessment: RiskAssessment;
  /** Drops the top border/spacing and "Result" title meant for sitting
   *  below a form — used when this renders as its own card body instead. */
  compact?: boolean;
}) {
  const categories = assessmentCategories(assessment);

  return (
    <div
      style={
        compact
          ? undefined
          : {
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid var(--c-border-soft)",
            }
      }
    >
      {!compact && (
        <div className="mc-card-title" style={{ marginBottom: 14 }}>
          Result
        </div>
      )}

      <div className="mc-pairs" style={{ marginBottom: 16 }}>
        <div>
          <div className="mc-pair-label">Risk level</div>
          <div style={{ marginTop: 4 }}>
            <RiskBadge level={assessment.final_risk_level} />
          </div>
        </div>
        <Pair
          label="Confidence"
          value={
            assessment.confidence
              ? `${Math.round(Number(assessment.confidence) * 100)}%`
              : "Not reported"
          }
        />
      </div>

      {/* The model is trained region-blind, so the level acted on can differ
          from the one it returned — showing only the final level would hide
          that adjustment from someone testing the model. */}
      {assessment.final_risk_level !== assessment.risk_level && (
        <p className="mc-note-line">
          The model returned <strong>{riskLabel(assessment.risk_level)}</strong>
          ; the population adjustment raised it to{" "}
          <strong>{riskLabel(assessment.final_risk_level)}</strong>.
        </p>
      )}

      {categories.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="mc-card-sub" style={{ marginBottom: 8 }}>
            Clinical categories
          </div>
          <div className="mc-pairs">
            {categories.map(({ label, value }) => (
              <Pair key={label} label={label} value={value} />
            ))}
          </div>
        </div>
      )}

      <div className="mc-ai" style={{ marginTop: 16 }}>
        <span className="mc-ai-tag">
          <Brain size={12} strokeWidth={2.3} aria-hidden />
          AI model
        </span>
        <p className="mc-ai-note">
          {assessmentSource(assessment)}. Decision support only — never a
          diagnosis, and always reviewed by a clinician.
        </p>
      </div>
    </div>
  );
}
