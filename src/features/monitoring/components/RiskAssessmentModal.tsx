"use client";

import { useState } from "react";
import { Brain, X } from "lucide-react";

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
  onClose: () => void;
}

/**
 * Score a set of vitals through the model and see what comes back.
 *
 * This records a real reading — there is no dry-run endpoint, and inventing
 * one on the client would score something the patient's record does not
 * contain. So the vitals entered here become part of the record, and the
 * assessment shown is the one the alerting layer acted on.
 */
export function RiskAssessmentModal({
  pregnancyId,
  patientName,
  onClose,
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
      setResult(risk.current);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not score these vitals."
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Score vitals through the model
            </h2>
            <p className="text-sm text-slate-500 mt-1">{patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>This records a real reading.</strong> The vitals below are
              saved to {patientName}&rsquo;s record and scored like any other,
              so an alert can be raised from them.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {VITAL_FIELDS.map(({ field, label, unit, step, placeholder }) => (
                <div key={field}>
                  <label
                    className="block text-xs font-semibold text-slate-600 mb-2"
                    htmlFor={`modal-${field}`}
                  >
                    {label} ({unit})
                  </label>
                  <input
                    id={`modal-${field}`}
                    type="number"
                    step={step}
                    value={values[field] ?? ""}
                    onChange={(e) => set(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={record.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {record.isPending ? "Scoring…" : "Record and score"}
            </button>
          </form>

          {result && <ModalResult assessment={result} />}
        </div>
      </div>
    </div>
  );
}

function ModalResult({ assessment }: { assessment: RiskAssessment }) {
  const categories = assessmentCategories(assessment);

  return (
    <div className="space-y-4 border-t border-slate-200 pt-6">
      <h3 className="font-semibold text-slate-900">Result</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="text-xs text-slate-600 uppercase font-semibold mb-2">
            Risk level
          </div>
          <RiskBadge level={assessment.final_risk_level} />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="text-xs text-slate-600 uppercase font-semibold mb-2">
            Confidence
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {assessment.confidence
              ? `${Math.round(Number(assessment.confidence) * 100)}%`
              : "Not reported"}
          </div>
        </div>
      </div>

      {/* The model is trained region-blind, so the level acted on can differ
          from the one it returned. Showing only the final level would hide
          that adjustment from the person testing the model. */}
      {assessment.final_risk_level !== assessment.risk_level && (
        <p className="text-sm text-slate-700">
          The model returned <strong>{riskLabel(assessment.risk_level)}</strong>
          ; the population adjustment raised it to{" "}
          <strong>{riskLabel(assessment.final_risk_level)}</strong>.
        </p>
      )}

      {categories.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-900 text-sm">
            Clinical categories
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {categories.map(({ label, value }) => (
              <div key={label} className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-600">{label}</div>
                <div className="font-semibold text-slate-900">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Brain size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          {assessmentSource(assessment)}. Decision support only — never a
          diagnosis, and always reviewed by a clinician.
        </p>
      </div>
    </div>
  );
}
