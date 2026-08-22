"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  HeartPulse,
  Plus,
  Watch,
  X,
} from "lucide-react";

import {
  useLatestReadings,
  useReadings,
  useRecordReading,
  useSimulateReadings,
} from "../hooks/useMonitoring";
import { READING_TYPES, readingAge, type ReadingType } from "../types";
import { VitalsChart } from "./VitalsChart";

/**
 * The monitoring surface for one pregnancy.
 *
 * The age of each reading is always shown, and goes amber once it is stale.
 * Silence is the failure mode that matters in monitoring: a panel that looks
 * calm because the band stopped reporting is worse than one showing a bad
 * number, because nobody goes looking for it.
 */

interface Props {
  pregnancyId: string;
  /** The dev-only generator is hidden in production, and the API refuses it too. */
  allowSimulation?: boolean;
}

export function VitalsPanel({ pregnancyId, allowSimulation = true }: Props) {
  const [selected, setSelected] = useState<ReadingType>("blood_pressure");
  const [showEntry, setShowEntry] = useState(false);

  const latest = useLatestReadings(pregnancyId);
  const series = useReadings(pregnancyId, selected);
  const simulate = useSimulateReadings(pregnancyId);

  const readings = latest.data?.readings ?? {};
  const totalCount = latest.data?.total_count ?? 0;

  if (latest.isPending) {
    return (
      <section className="mc-card">
        <div className="mc-card-head">
          <div className="mc-card-title">Vitals</div>
        </div>
        <div className="mc-empty">Loading readings…</div>
      </section>
    );
  }

  return (
    <section className="mc-card">
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Vitals</div>
          <div className="mc-card-sub">
            {totalCount > 0
              ? `${totalCount.toLocaleString()} readings recorded`
              : "No readings yet"}
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
          {allowSimulation && (
            <button
              className="mc-btn-ghost mc-btn-sm"
              disabled={simulate.isPending}
              onClick={() => simulate.mutate({ hours: 24, elevated: false })}
              title="Development only — generates clearly-labelled simulated readings"
            >
              <Activity size={13} strokeWidth={2.2} />
              {simulate.isPending ? "Generating…" : "Simulate 24h"}
            </button>
          )}
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
            Assign a monitoring band, record a reading by hand, or generate
            simulated data to see how this looks with a full day of monitoring.
          </span>
        </div>
      ) : (
        <>
          <div className="mc-vitals-row">
            {READING_TYPES.map(({ type, label, short }) => {
              const reading = readings[type];
              if (!reading) {
                // Absent stays absent — never shown as a normal-looking value.
                return (
                  <div key={type} className="mc-vital mc-vital-missing">
                    <span className="mc-vital-label">{label}</span>
                    <span className="mc-vital-value">—</span>
                    <span className="mc-vital-age">No reading</span>
                  </div>
                );
              }
              const age = readingAge(reading.recorded_at);
              return (
                <button
                  key={type}
                  className="mc-vital"
                  aria-pressed={selected === type}
                  onClick={() => setSelected(type)}
                  title={`Show ${label} over time`}
                >
                  <span className="mc-vital-label">
                    {short}
                    {reading.is_simulated && (
                      <span className="mc-sim-tag">sim</span>
                    )}
                  </span>
                  <span className="mc-vital-value">
                    {reading.display_value}
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
            {series.isPending ? (
              <div className="mc-empty">Loading chart…</div>
            ) : (series.data?.results.length ?? 0) === 0 ? (
              <div className="mc-empty">
                <span className="mc-empty-text">
                  No{" "}
                  {READING_TYPES.find(
                    (r) => r.type === selected
                  )?.label.toLowerCase()}{" "}
                  readings recorded.
                </span>
              </div>
            ) : (
              <VitalsChart
                readings={series.data!.results}
                readingType={selected}
              />
            )}
          </div>
        </>
      )}

      {simulate.isError && (
        <div className="mc-card-foot">
          <p className="mc-alert mc-alert-error" style={{ marginBottom: 0 }}>
            <AlertTriangle size={14} strokeWidth={2} aria-hidden />
            {simulate.error instanceof Error
              ? simulate.error.message
              : "Could not generate readings."}
          </p>
        </div>
      )}
    </section>
  );
}

function ManualReadingForm({
  pregnancyId,
  onDone,
}: {
  pregnancyId: string;
  onDone: () => void;
}) {
  const [type, setType] = useState<ReadingType>("blood_pressure");
  const [value, setValue] = useState("");
  const [secondary, setSecondary] = useState("");
  const record = useRecordReading(pregnancyId);

  const isBloodPressure = type === "blood_pressure";
  const unit = READING_TYPES.find((r) => r.type === type)?.unit ?? "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await record.mutateAsync({
        reading_type: type,
        value,
        ...(isBloodPressure ? { value_secondary: secondary } : {}),
      });
      setValue("");
      setSecondary("");
      onDone();
    } catch {
      // Surfaced below by the mutation's error state.
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="mc-formgrid">
        <div>
          <label className="mc-label" htmlFor="reading-type">
            Measurement
          </label>
          <select
            id="reading-type"
            className="mc-input"
            value={type}
            onChange={(e) => {
              setType(e.target.value as ReadingType);
              setSecondary("");
            }}
          >
            {READING_TYPES.map((r) => (
              <option key={r.type} value={r.type}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mc-label" htmlFor="reading-value">
            {isBloodPressure ? "Systolic" : "Value"}{" "}
            <span className="mc-req">*</span>
          </label>
          <input
            id="reading-value"
            className="mc-input"
            type="number"
            step="0.1"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={unit}
          />
        </div>
        {isBloodPressure && (
          <div>
            <label className="mc-label" htmlFor="reading-diastolic">
              Diastolic <span className="mc-req">*</span>
            </label>
            <input
              id="reading-diastolic"
              className="mc-input"
              type="number"
              step="0.1"
              required
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              placeholder="mmHg"
            />
          </div>
        )}
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
