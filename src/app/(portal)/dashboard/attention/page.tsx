"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";

import { AttentionQueue } from "@/features/monitoring/components/AttentionQueue";
import { useAttentionQueue } from "@/features/monitoring/hooks/useMonitoring";

/**
 * The list a clinician's shift starts from.
 *
 * The dashboard shows the top few; this is the whole queue. Ordered by the
 * server — most severe first, unreviewed above reviewed, longest-waiting first
 * within a tie — so the row that most needs a person is always at the top and
 * the order never depends on which filter is open.
 *
 * The tabs are filters over one already-loaded list, not separate requests.
 * A clinician switching between them is comparing, not navigating, and a
 * network round trip between "critical" and "all" would make the counts
 * disagree for as long as it took.
 */

const LEVELS = [
  { key: "", label: "Everyone" },
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "moderate", label: "Moderate" },
] as const;

export default function AttentionPage() {
  const [level, setLevel] = useState<string>("");
  const queue = useAttentionQueue();

  const rows = queue.data?.results ?? [];
  const countFor = (key: string) =>
    key ? rows.filter((row) => row.level === key).length : rows.length;

  // Patients nobody is responsible for are the ones most likely to be missed,
  // so the number is stated rather than left to be noticed row by row.
  const unattended = rows.filter(
    (row) => !row.has_responsible_clinician
  ).length;

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">Needs attention</h1>
          <p className="mc-sub">
            Every monitored patient currently outside clinical range, most
            urgent first.
          </p>
        </div>

        <div className="mc-head-aside">
          {queue.isFetching && (
            <div className="mc-head-date">
              <RefreshCw size={13} strokeWidth={2} aria-hidden /> Updating…
            </div>
          )}
          <div>
            {unattended > 0
              ? `${unattended} without a clinician`
              : "Every patient here has a clinician"}
          </div>
        </div>
      </div>

      <div className="mc-tabs" role="tablist" aria-label="Filter by severity">
        {LEVELS.map((tab) => {
          const active = tab.key === level;
          const count = countFor(tab.key);
          return (
            <button
              key={tab.key || "all"}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              className="mc-tab"
              onClick={() => setLevel(tab.key)}
            >
              {tab.label}
              {/* The count is the reason to click, so it sits in the tab
                  rather than being discovered after switching. */}
              <span className="mc-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <motion.div
        // Keyed on the filter so switching tabs reads as the list being
        // replaced, not as rows quietly rearranging under the cursor.
        key={level || "all"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        <AttentionQueue level={level || undefined} />
      </motion.div>
    </>
  );
}
