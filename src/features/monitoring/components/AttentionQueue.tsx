"use client";

import Link from "next/link";
import { Activity, UserX } from "lucide-react";
import { motion } from "motion/react";

import { useAttentionQueue } from "../hooks/useMonitoring";
import { readingAge } from "../types";
import { RiskBadge } from "./RiskBadge";

interface Props {
  /** The dashboard shows a short list; the full page shows everything. */
  limit?: number;
  /** Narrow to one severity. Undefined means every actionable level. */
  level?: string;
  /** Suppress the "n more" footer where the page already says the total. */
  hideMore?: boolean;
}

/**
 * The list a clinician's shift starts from.
 *
 * Ordered by the server: most severe first, unreviewed above reviewed, oldest
 * first within a tie. It is scanned rather than read, so every row has to say
 * why it is there without being opened.
 */
export function AttentionQueue({ limit, level, hideMore }: Props) {
  const queue = useAttentionQueue();

  const all = queue.data?.results ?? [];
  const rows = level ? all.filter((row) => row.level === level) : all;
  const shown = limit ? rows.slice(0, limit) : rows;

  if (queue.isPending) {
    return <div className="mc-empty">Loading queue…</div>;
  }

  if (queue.isError) {
    // An error must not render as an empty queue: "nothing to review" and
    // "we could not find out" are opposite messages to a clinician.
    return (
      <div className="mc-empty">
        <span className="mc-empty-title">Queue unavailable</span>
        <span className="mc-empty-text">
          The attention queue could not be loaded, so this is not a statement
          that no patient needs review. Refresh to try again.
        </span>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mc-empty">
        <span className="mc-empty-icon">
          <Activity size={20} strokeWidth={1.9} aria-hidden />
        </span>
        <span className="mc-empty-title">
          {level ? "None at this level" : "Nothing to review"}
        </span>
        <span className="mc-empty-text">
          {level
            ? "No patient is currently at this severity. Others may still need attention — check the other tabs."
            : "No monitored patient is currently outside range. Patients appear here the moment a reading crosses a clinical threshold — or stops arriving."}
        </span>
      </div>
    );
  }

  return (
    <div className="mc-queue">
      {shown.map((row, index) => {
        const age = readingAge(row.assessed_at);
        return (
          <motion.div
            key={row.pregnancy_id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.035 }}
          >
            <Link
              href={`/dashboard/patients/${row.patient_id}`}
              className={`mc-queue-row is-${row.level}`}
            >
              <div className="mc-queue-main">
                <div className="mc-queue-top">
                  <span className="mc-queue-name">{row.full_name}</span>
                  <RiskBadge
                    level={row.level}
                    unacknowledged={row.needs_acknowledgement}
                  />
                </div>
                <div className="mc-queue-reasons">
                  {row.reasons.slice(0, 2).map((reason) => (
                    <span key={reason}>{reason}</span>
                  ))}
                </div>
              </div>
              <div className="mc-queue-meta">
                <span>{row.gestational_age}</span>
                {row.has_responsible_clinician ? (
                  <span>{row.assigned_staff_name}</span>
                ) : (
                  /* An unattended high-risk patient is the case most likely to
                   be missed, so it is called out rather than left blank. */
                  <span className="mc-queue-unassigned">
                    <UserX size={12} strokeWidth={2.2} aria-hidden />
                    No clinician
                  </span>
                )}
                <span className={age.stale ? "is-stale" : undefined}>
                  {age.text}
                </span>
              </div>
            </Link>
          </motion.div>
        );
      })}

      {limit && !hideMore && rows.length > limit && (
        <div className="mc-queue-more">
          {rows.length - limit} more patient
          {rows.length - limit === 1 ? "" : "s"} needing attention
        </div>
      )}
    </div>
  );
}
