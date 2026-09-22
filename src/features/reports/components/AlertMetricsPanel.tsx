"use client";

import Link from "next/link";
import { motion } from "motion/react";

import type { Alert } from "@/features/alerts/types";
import { raisedAgo } from "@/features/alerts/types";
import { RiskBadge } from "@/features/monitoring/components/RiskBadge";

/** The most recent live alerts — links back to the existing Alerts page
 *  rather than duplicating acknowledge/resolve actions here; a report is
 *  for seeing the shape of things, not for working a queue. */
export function RecentAlertsList({ alerts }: { alerts: Alert[] }) {
  const recent = alerts.slice(0, 5);

  return (
    <div className="mc-alertlist">
      {recent.map((alert, index) => (
        <motion.div
          key={alert.id}
          className="mc-alertrow"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.03 }}
        >
          <div className="mc-alertrow-head" style={{ cursor: "default" }}>
            <div className="mc-alertrow-main">
              <div className="mc-alertrow-top">
                <span className="mc-alertrow-name">{alert.patient_name}</span>
                <RiskBadge level={alert.level} />
              </div>
              <div className="mc-alertrow-reasons">
                <span>{alert.tier_label}</span>
              </div>
            </div>
            <div className="mc-alertrow-meta">
              <span>{raisedAgo(alert.raised_at)}</span>
              <Link href="/dashboard/alerts" className="mc-row-link">
                Open queue
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
