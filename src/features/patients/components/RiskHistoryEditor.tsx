"use client";

import { useState } from "react";

import { useUpdatePregnancy } from "../hooks/usePatients";
import {
  RISK_FACTORS,
  type Pregnancy,
  type RiskAnswer,
  type RiskFactorField,
} from "../types";

const ANSWERS: { value: RiskAnswer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
];

function fromPregnancy(p: Pregnancy): Record<RiskFactorField, RiskAnswer> {
  return Object.fromEntries(
    RISK_FACTORS.map(({ field }) => [field, p[field]])
  ) as Record<RiskFactorField, RiskAnswer>;
}

/**
 * The seven obstetric-history answers, editable after enrolment. Unknown is a
 * real answer ("nobody asked") and stays distinct from No — recording No for
 * something never asked would hide risk, so nothing here defaults to it.
 */
export function RiskHistoryEditor({
  patientId,
  pregnancy,
  canWrite,
}: {
  patientId: string;
  pregnancy: Pregnancy;
  canWrite: boolean;
}) {
  const [answers, setAnswers] = useState(() => fromPregnancy(pregnancy));
  const [saved, setSaved] = useState(false);
  const update = useUpdatePregnancy(patientId, pregnancy.id);

  const dirty = RISK_FACTORS.some(
    ({ field }) => answers[field] !== pregnancy[field]
  );
  const unanswered = RISK_FACTORS.filter(
    ({ field }) => answers[field] === "unknown"
  ).length;

  const save = () => {
    setSaved(false);
    update.mutate(answers, { onSuccess: () => setSaved(true) });
  };

  return (
    <section className="mc-card" style={{ marginTop: 18 }}>
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Obstetric history</div>
          <div className="mc-card-sub">
            Leave as Unknown if it wasn&apos;t asked — that is different from
            No, and recording it as No would hide risk.
          </div>
        </div>
        {unanswered > 0 && (
          <span className="mc-badge mc-badge-neutral">
            {unanswered} not answered
          </span>
        )}
      </div>
      <div className="mc-card-body">
        <div className="mc-risklist">
          {RISK_FACTORS.map(({ field, label }) => (
            <div key={field} className="mc-riskrow">
              <span className="mc-riskrow-label">{label}</span>
              <div className="mc-segmented" role="group" aria-label={label}>
                {ANSWERS.map(({ value, label: text }) => (
                  <button
                    key={value}
                    type="button"
                    className="mc-segment"
                    aria-pressed={answers[field] === value}
                    disabled={!canWrite}
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [field]: value }))
                    }
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {update.isError && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
            {update.error instanceof Error
              ? update.error.message
              : "Could not save the obstetric history."}
          </p>
        )}
        {saved && !update.isPending && !dirty && (
          <p className="mc-alert mc-alert-success" style={{ marginTop: 12 }}>
            Saved.
          </p>
        )}

        {canWrite && (
          <button
            type="button"
            className="mc-btn mc-btn-sm"
            style={{ marginTop: 14 }}
            disabled={!dirty || update.isPending}
            onClick={save}
          >
            {update.isPending ? "Saving…" : "Save obstetric history"}
          </button>
        )}
      </div>
    </section>
  );
}
