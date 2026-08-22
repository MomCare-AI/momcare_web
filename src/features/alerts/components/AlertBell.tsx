"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, ChevronRight, Clock, UserX } from "lucide-react";

import { RiskBadge } from "@/features/monitoring/components/RiskBadge";
import { useAcknowledgeAlert, useAlerts } from "../hooks/useAlerts";
import { raisedAgo, timeToEscalation, type Alert } from "../types";

/**
 * The notification bell — how an alert reaches somebody who is not looking at
 * the patient's record.
 *
 * The badge counts only *unanswered* alerts. Counting acknowledged ones too
 * would leave a number sitting there after the work was done, and a badge that
 * never clears is a badge people stop reading.
 */
export function AlertBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const alerts = useAlerts("live");
  const acknowledge = useAcknowledgeAlert();

  const rows = alerts.data?.results ?? [];
  const unanswered = alerts.data?.unacknowledged ?? 0;

  // Close on outside click and on Escape — a panel that traps the pointer is
  // the last thing wanted on a screen someone is using under pressure.
  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="mc-bell-wrap" ref={wrapRef}>
      <button
        className="mc-iconbtn"
        aria-label={
          unanswered
            ? `Notifications — ${unanswered} unanswered alert${unanswered === 1 ? "" : "s"}`
            : "Notifications"
        }
        aria-expanded={open}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <Bell size={17} strokeWidth={1.9} />
        {unanswered > 0 && (
          <span className="mc-bell-count" aria-hidden>
            {unanswered > 9 ? "9+" : unanswered}
          </span>
        )}
      </button>

      {open && (
        <div className="mc-bell-panel" role="dialog" aria-label="Alerts">
          <div className="mc-bell-head">
            <span>Alerts</span>
            {rows.length > 0 && (
              <span className="mc-bell-head-count">
                {unanswered} unanswered of {rows.length}
              </span>
            )}
          </div>

          {alerts.isPending ? (
            <div className="mc-bell-empty">Loading…</div>
          ) : alerts.isError ? (
            // Never render a failure as silence: "no alerts" and "we could not
            // find out" are opposite messages to a clinician.
            <div className="mc-bell-empty">
              Alerts could not be loaded. This is not confirmation that there
              are none.
            </div>
          ) : rows.length === 0 ? (
            <div className="mc-bell-empty">
              No open alerts. Patients appear here when a reading crosses a
              clinical threshold, or stops arriving.
            </div>
          ) : (
            <ul className="mc-bell-list">
              {rows.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => acknowledge.mutate(alert.id)}
                  acknowledging={
                    acknowledge.isPending && acknowledge.variables === alert.id
                  }
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function AlertRow({
  alert,
  onAcknowledge,
  acknowledging,
  onNavigate,
}: {
  alert: Alert;
  onAcknowledge: () => void;
  acknowledging: boolean;
  onNavigate: () => void;
}) {
  const escalation = timeToEscalation(alert.next_escalation_at);
  const answered = alert.status === "acknowledged";

  return (
    <li
      className={`mc-bell-item is-${alert.level}${answered ? " is-answered" : ""}`}
    >
      <div className="mc-bell-item-top">
        <RiskBadge level={alert.level} />
        <span className="mc-bell-name">{alert.patient_name}</span>
        <span className="mc-bell-when">{raisedAgo(alert.raised_at)}</span>
      </div>

      <div className="mc-bell-reasons">
        {alert.reasons.slice(0, 2).map((reason) => (
          <span key={reason}>{reason}</span>
        ))}
      </div>

      <div className="mc-bell-meta">
        <span>{alert.gestational_age}</span>
        {alert.assigned_staff_name ? (
          <span>{alert.assigned_staff_name}</span>
        ) : (
          <span className="mc-bell-unassigned">
            <UserX size={11} strokeWidth={2.2} aria-hidden />
            No clinician
          </span>
        )}
        {/* Tier is shown once it has climbed: knowing an alert has already
            reached your supervisor changes how you treat it. */}
        {alert.tier > 1 && <span>at {alert.tier_label.toLowerCase()}</span>}
      </div>

      <div className="mc-bell-actions">
        {answered ? (
          <span className="mc-bell-answered">
            <Check size={12} strokeWidth={2.4} aria-hidden />
            {alert.acknowledged_by_name || "Acknowledged"}
          </span>
        ) : (
          <>
            <button
              type="button"
              className="mc-btn mc-btn-sm"
              onClick={onAcknowledge}
              disabled={acknowledging}
            >
              <Check size={13} strokeWidth={2.2} aria-hidden />
              {acknowledging ? "Recording…" : "Acknowledge"}
            </button>
            {escalation && (
              <span
                className={`mc-bell-clock${escalation.imminent ? " is-imminent" : ""}`}
              >
                <Clock size={11} strokeWidth={2.2} aria-hidden />
                {escalation.text}
              </span>
            )}
          </>
        )}
        <Link
          href={`/dashboard/patients/${alert.patient_id}`}
          className="mc-bell-open"
          onClick={onNavigate}
        >
          Open record
          <ChevronRight size={12} strokeWidth={2.2} aria-hidden />
        </Link>
      </div>
    </li>
  );
}
