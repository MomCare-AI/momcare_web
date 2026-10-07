"use client";

import { useState } from "react";
import { Gauge } from "lucide-react";

import { usePortal } from "@/app/(portal)/dashboard/portal";
import { useUpdateConfidenceThreshold } from "@/features/portal/hooks/usePortalData";
import { Card, CardHeader } from "@/shared/ui/Card";
import { Pair } from "@/shared/ui/Pair";

/**
 * How sure the model has to be before its answer is accepted without a second
 * look.
 *
 * Entered as a percentage because that is how the result is read everywhere
 * else in the portal; stored as the 0-1 fraction the API expects. Raising it
 * flags more assessments for review, which is the safer direction and also
 * the noisier one — so the consequence is stated rather than left to be
 * discovered from the review queue filling up.
 */
export function ConfidenceThresholdTab() {
  const { org } = usePortal();
  const update = useUpdateConfidenceThreshold();
  const effectivePercent = Math.round(
    Number(org.effective_confidence_threshold) * 100
  );
  const hasOverride = org.confidence_threshold !== null;

  const [value, setValue] = useState(String(effectivePercent));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const percent = Number(value);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return;
    update.mutate(percent / 100);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="mc-card-title">
            <Gauge size={17} strokeWidth={1.9} aria-hidden /> Model confidence
            threshold
          </h2>
          <p className="mc-card-sub">
            An assessment the model is less sure of than this is flagged for a
            clinician to look again — whatever risk level it landed on.
          </p>
        </div>
      </CardHeader>

      <form onSubmit={submit} className="mc-card-body">
        <div className="mc-pairs" style={{ marginBottom: 16 }}>
          <Pair label="Currently in use" value={`${effectivePercent}%`} />
          <Pair
            label="Source"
            value={
              hasOverride
                ? `${org.name}'s own setting`
                : "Platform default (this hospital has not set one)"
            }
          />
        </div>

        <div>
          <label className="mc-label" htmlFor="confidence_threshold">
            Threshold <span className="mc-unit">(%)</span>
          </label>
          <input
            id="confidence_threshold"
            className="mc-input"
            type="number"
            min="0"
            max="100"
            step="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        {update.isError && (
          <p className="mc-alert mc-alert-error">
            {update.error instanceof Error
              ? update.error.message
              : "Could not save this threshold."}
          </p>
        )}
        {update.isSuccess && !update.isPending && (
          <p className="mc-alert mc-alert-success">Threshold saved.</p>
        )}

        <div className="mc-actions" style={{ marginTop: 14 }}>
          <button type="submit" className="mc-btn" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save threshold"}
          </button>
          {hasOverride && (
            <button
              type="button"
              className="mc-btn-ghost"
              disabled={update.isPending}
              // Clearing is not the same as setting the default's current
              // number: it follows the platform default from now on, including
              // any later change to it.
              onClick={() => update.mutate(null)}
            >
              Follow the platform default instead
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}
