"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { useWorklist } from "../hooks/usePatients";

interface Props {
  assignedToMe: boolean;
}

/**
 * Administrative and care-continuity gaps — a different question from the
 * Attention Queue's clinical severity: "does this case have a gap that has
 * nothing to do with today's vitals being bad?" Deliberately its own list,
 * never merged with the Attention Queue's data, the same way "not assessed"
 * stays visually distinct from "stable" everywhere else in this portal.
 *
 * See docs/worklist-feature-scope.md — the two day-thresholds behind these
 * reasons are administrative defaults, not clinically validated.
 */
export function WorklistPanel({ assignedToMe }: Props) {
  const worklist = useWorklist(assignedToMe);

  if (worklist.isPending) {
    return <div className="mc-empty">Loading worklist…</div>;
  }

  if (worklist.isError) {
    // An error must never render as "nothing needs attention" - those are
    // opposite claims, same discipline as the Attention Queue.
    return (
      <div className="mc-empty">
        <span className="mc-empty-title">Worklist unavailable</span>
        <span className="mc-empty-text">
          This is not a statement that every case is up to date — the list could
          not be loaded. Refresh to try again.
        </span>
      </div>
    );
  }

  const rows = worklist.data?.results ?? [];

  if (rows.length === 0) {
    return (
      <div className="mc-empty">
        <span className="mc-empty-icon">
          <ClipboardList size={20} strokeWidth={1.9} aria-hidden />
        </span>
        <span className="mc-empty-title">Nothing outstanding</span>
        <span className="mc-empty-text">
          No case is missing a recent reading, a recent note, an answered risk
          history, or a lead clinician right now.
        </span>
      </div>
    );
  }

  return (
    <div className="mc-queue">
      {rows.map((row) => (
        <Link
          key={row.pregnancy_id}
          href={`/dashboard/patients/${row.patient_id}`}
          className="mc-queue-row"
        >
          <div className="mc-queue-main">
            <div className="mc-queue-top">
              <span className="mc-queue-name">{row.full_name}</span>
              <span className="mc-badge mc-badge-neutral">
                {row.reasons.length} outstanding
              </span>
            </div>
            <div className="mc-queue-reasons">
              {row.reasons.map((reason) => (
                <span key={reason.code}>{reason.detail}</span>
              ))}
            </div>
          </div>
          <div className="mc-queue-meta">
            <span>{row.gestational_age}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
