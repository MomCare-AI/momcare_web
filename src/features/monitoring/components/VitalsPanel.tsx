"use client";

import { useState } from "react";
import { AlertTriangle, HeartPulse, Plus, Watch, X } from "lucide-react";

import {
  useLatestReadings,
  useReadings,
  useRecordReading,
} from "../hooks/useMonitoring";
import {
  VITAL_FIELDS,
  VITAL_METRICS,
  latestForMetric,
  readingAge,
  type NumericVital,
  type VitalMetric,
} from "../types";
import { VitalsChart } from "./VitalsChart";

/**
 * The monitoring surface for one pregnancy.
 *
 * The age of each vital is always shown, and goes amber once it is stale.
 * Silence is the failure mode that matters in monitoring: a panel that looks
 * calm because the band stopped reporting is worse than one showing a bad
 * number, because nobody goes looking for it.
 */

interface Props {
  pregnancyId: string;
}

export function VitalsPanel({ pregnancyId }: Props) {
  const [selected, setSelected] = useState<VitalMetric>("blood_pressure");
  const [showEntry, setShowEntry] = useState(false);

  const series = useReadings(pregnancyId);
  const contact = useLatestReadings(pregnancyId);
  const readings = series.data?.results ?? [];
  const totalCount = series.data?.count ?? 0;
  const lastContact = contact.data?.reading
    ? readingAge(contact.data.reading.recorded_at)
    : null;

  if (series.isPending) {
    return (
      <section className="mc-card">
        <div className="mc-card-head">
          <div className="mc-card-title">Vitals</div>
        </div>
        <div className="mc-empty">Loading readings…</div>
      </section>
    );
  }

  if (series.isError) {
    // An error must not render as "no readings": those are opposite messages
    // to a clinician deciding whether this patient is being watched at all.
    return (
      <section className="mc-card">
        <div className="mc-card-head">
          <div className="mc-card-title">Vitals</div>
        </div>
        <div className="mc-empty">
          <span className="mc-empty-title">Readings unavailable</span>
          <span className="mc-empty-text">
            These could not be loaded, so this is not a statement that no vitals
            have been recorded. Refresh to try again.
          </span>
        </div>
      </section>
    );
  }

  const selectedSpec = VITAL_METRICS.find((m) => m.metric === selected);

  return (
    <section className="mc-card">
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Vitals</div>
          <div className="mc-card-sub">
            {totalCount > 0
              ? `${totalCount.toLocaleString()} reading${
                  totalCount === 1 ? "" : "s"
                } recorded`
              : "No readings yet"}
            {/* Last contact, not last-value-per-vital: every metric below can
                still show a good number from its own last measurement while
                the band itself has been silent for a day. */}
            {lastContact && (
              <>
                {" · last contact "}
                <span className={lastContact.stale ? "is-stale" : undefined}>
                  {lastContact.text}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="mc-row-actions">
          <button
            className="mc-btn-ghost mc-btn-sm"
            onClick={() => setShowEntry((v) => !v)}
          >
            {showEntry ? (
              <X size={13} strokeWidth={2.2} />
            ) : (
              <Plus size={13} strokeWidth={2.2} />
            )}
            {showEntry ? "Cancel" : "Record reading"}
          </button>
        </div>
      </div>

      {showEntry && (
        <div
          className="mc-card-body"
          style={{ borderBottom: "1px solid var(--c-border-soft)" }}
        >
          <ManualReadingForm
            pregnancyId={pregnancyId}
            onDone={() => setShowEntry(false)}
          />
        </div>
      )}

      {totalCount === 0 ? (
        <div className="mc-empty">
          <span className="mc-empty-icon">
            <HeartPulse size={20} strokeWidth={1.9} aria-hidden />
          </span>
          <span className="mc-empty-title">No readings yet</span>
          <span className="mc-empty-text">
            Assign a monitoring band or record a reading by hand. Risk is scored
            the moment the first vital arrives.
          </span>
        </div>
      ) : (
        <>
          <div className="mc-vitals-row">
            {VITAL_METRICS.map(({ metric, label, short, unit }) => {
              const latest = latestForMetric(readings, metric);
              if (!latest) {
                // Absent stays absent — never shown as a normal-looking value.
                return (
                  <div key={metric} className="mc-vital mc-vital-missing">
                    <span className="mc-vital-label">{short}</span>
                    <span className="mc-vital-value">—</span>
                    <span className="mc-vital-age">Not measured</span>
                  </div>
                );
              }
              const age = readingAge(latest.reading.recorded_at);
              return (
                <button
                  key={metric}
                  className="mc-vital"
                  aria-pressed={selected === metric}
                  onClick={() => setSelected(metric)}
                  title={`Show ${label.toLowerCase()} over time`}
                >
                  <span className="mc-vital-label">{short}</span>
                  <span className="mc-vital-value">
                    {latest.secondary === null
                      ? `${latest.value} ${unit}`
                      : `${latest.value}/${latest.secondary}`}
                  </span>
                  <span
                    className={`mc-vital-age${age.stale ? " is-stale" : ""}`}
                  >
                    {age.stale && (
                      <AlertTriangle size={11} strokeWidth={2.4} aria-hidden />
                    )}
                    {age.text}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mc-card-body">
            {latestForMetric(readings, selected) === null ? (
              <div className="mc-empty">
                <span className="mc-empty-text">
                  No {selectedSpec?.label.toLowerCase()} recorded.
                </span>
              </div>
            ) : (
              <VitalsChart readings={readings} metric={selected} />
            )}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Recording a reading by hand.
 *
 * Every vital is optional because a reading event does not have to carry all
 * nine — hemoglobin in particular comes from a monthly lab report, not the
 * band. The server enforces the two rules that matter: at least one vital,
 * and blood pressure only as a pair.
 */
function ManualReadingForm({
  pregnancyId,
  onDone,
}: {
  pregnancyId: string;
  onDone: () => void;
}) {
  const [values, setValues] = useState<Partial<Record<NumericVital, string>>>(
    {}
  );
  const record = useRecordReading(pregnancyId);

  const set = (field: NumericVital, value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<Record<NumericVital, number>> = {};
    for (const { field } of VITAL_FIELDS) {
      const raw = values[field];
      if (raw === undefined || raw.trim() === "") continue;
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) payload[field] = parsed;
    }

    try {
      await record.mutateAsync(payload);
      setValues({});
      onDone();
    } catch {
      // Surfaced below by the mutation's error state.
    }
  };

  return (
    <form onSubmit={submit}>
      <p className="mc-card-sub" style={{ marginBottom: 12 }}>
        Fill in whatever was measured — blank fields are left unrecorded rather
        than guessed. Blood pressure needs both halves.
      </p>

      <div className="mc-formgrid">
        {VITAL_FIELDS.map(({ field, label, unit, step, placeholder }) => (
          <div key={field}>
            <label className="mc-label" htmlFor={`vital-${field}`}>
              {label} <span className="mc-unit">({unit})</span>
            </label>
            <input
              id={`vital-${field}`}
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

      {record.isError && (
        <p className="mc-alert mc-alert-error">
          <AlertTriangle size={14} strokeWidth={2} aria-hidden />
          {record.error instanceof Error
            ? record.error.message
            : "Could not record this."}
        </p>
      )}

      <button type="submit" className="mc-btn" disabled={record.isPending}>
        <Watch size={14} strokeWidth={2} aria-hidden />
        {record.isPending ? "Recording…" : "Record reading"}
      </button>
    </form>
  );
}
