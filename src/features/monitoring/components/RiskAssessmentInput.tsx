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

interface Props {
  pregnancyId: string;
  patientName: string;
}

/**
 * Score a set of vitals through the model and see what comes back.
 *
 * This is the doctor-facing entry point to the model: type in a set of
 * vitals, submit, and the level the model actually returned is shown right
 * here — not buried in a chart or a second click away.
 *
 * It writes a real reading. There is no dry-run endpoint, and inventing one
 * on the client would score something the patient's record does not
 * contain — so the vitals entered here become part of the record, and the
 * result shown is the one the alerting layer acted on.
 */
export function RiskAssessmentInput({ pregnancyId, patientName }: Props) {
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not score these vitals."
      );
    }
  };

  return (
    <section className="mc-card">
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Score vitals</div>
          <div className="mc-card-sub">
            Enter a set of vitals for {patientName} and see what the model makes
            of them.
          </div>
        </div>
      </div>

      <div className="mc-card-body">
        <p className="mc-alert mc-alert-notice" style={{ marginBottom: 16 }}>
          <AlertTriangle size={14} strokeWidth={2} aria-hidden />
          This records a real reading on {patientName}&rsquo;s chart — the same
          as entering vitals from the Vitals card. There is no test mode.
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
      </div>
    </section>
  );
}

function ScoreResult({ assessment }: { assessment: RiskAssessment }) {
  const categories = assessmentCategories(assessment);

  return (
    <div
      style={{
        marginTop: 24,
        paddingTop: 20,
        borderTop: "1px solid var(--c-border-soft)",
      }}
    >
      <div className="mc-card-title" style={{ marginBottom: 14 }}>
        Result
      </div>

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

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mc-pair-label">{label}</div>
      <div className="mc-pair-value">{value}</div>
    </div>
  );
}
