"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { BellRing, Check, ChevronDown, UserX } from "lucide-react";

import {
  useAcknowledgeAlert,
  useAlert,
  useAlerts,
  useResolveAlert,
} from "@/features/alerts/hooks/useAlerts";
import type { Alert, AlertEvent } from "@/features/alerts/types";
import { usePortal } from "../layout";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Every alert this hospital has raised, and what happened to each.
 *
 * The bell shows what is unanswered right now. This page exists for the other
 * question — what did the system do, who was told, and when — which is the one
 * asked after the fact, and which the append-only event trail is kept to
 * answer. Until now nothing displayed it.
 */

const TABS = [
  { key: "live" as const, label: "Live" },
  { key: "resolved" as const, label: "Resolved" },
];

/** "in 4 min" / "overdue". Deadlines read forward; everything else reads back. */
function until(iso: string | null): { text: string; overdue: boolean } | null {
  if (!iso) return null;
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (minutes < 0) return { text: "overdue", overdue: true };
  if (minutes < 1) return { text: "under a minute", overdue: false };
  if (minutes < 60) return { text: `in ${minutes} min`, overdue: false };
  return { text: `in ${Math.round(minutes / 60)}h`, overdue: false };
}

function since(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AlertsPage() {
  usePageTitle("Alerts");
  const [tab, setTab] = useState<"live" | "resolved">("live");
  const [openId, setOpenId] = useState<string | null>(null);

  const alerts = useAlerts(tab);
  const rows = alerts.data?.results ?? [];
  const unanswered = alerts.data?.unacknowledged ?? 0;

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">Alerts</h1>
          <p className="mc-sub">
            Raised when a reading crosses a threshold, and escalated on a
            schedule until somebody answers.
          </p>
        </div>
        <div className="mc-head-aside">
          <div>
            {unanswered > 0
              ? `${unanswered} not yet answered`
              : "Everything raised has been answered"}
          </div>
        </div>
      </div>

      <div className="mc-tabs" role="tablist" aria-label="Filter alerts">
        {TABS.map((item) => {
          const active = item.key === tab;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              className="mc-tab"
              onClick={() => {
                setTab(item.key);
                setOpenId(null);
              }}
            >
              {item.label}
              {active && <span className="mc-tab-count">{rows.length}</span>}
            </button>
          );
        })}
      </div>

      {alerts.isPending && <div className="mc-empty">Loading alerts…</div>}

      {alerts.isError && (
        /* An error must never render as an empty list. "No alerts" and "we
           could not find out" are opposite messages to a clinician. */
        <div className="mc-empty">
          <span className="mc-empty-title">Alerts unavailable</span>
          <span className="mc-empty-text">
            This is not a statement that nothing is wrong — the list could not
            be loaded. Refresh to try again.
          </span>
        </div>
      )}

      {alerts.isSuccess && rows.length === 0 && (
        <div className="mc-empty">
          <span className="mc-empty-icon">
            <BellRing size={20} strokeWidth={1.9} aria-hidden />
          </span>
          <span className="mc-empty-title">
            {tab === "live" ? "No live alerts" : "Nothing resolved yet"}
          </span>
          <span className="mc-empty-text">
            {tab === "live"
              ? "Nobody is currently waiting on a response. Alerts appear here the moment a reading crosses a clinical threshold."
              : "Alerts move here once somebody records what happened."}
          </span>
        </div>
      )}

      <div className="mc-alertlist">
        {rows.map((alert, index) => (
          <AlertRow
            key={alert.id}
            alert={alert}
            index={index}
            open={openId === alert.id}
            onToggle={() => setOpenId(openId === alert.id ? null : alert.id)}
          />
        ))}
      </div>
    </>
  );
}

function AlertRow({
  alert,
  index,
  open,
  onToggle,
}: {
  alert: Alert;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const next = until(alert.next_escalation_at);

  return (
    <motion.div
      className={`mc-alertrow is-${alert.level}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index, 8) * 0.035 }}
    >
      <button
        type="button"
        className="mc-alertrow-head"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="mc-alertrow-main">
          <div className="mc-alertrow-top">
            <span className="mc-alertrow-name">{alert.patient_name}</span>
            <span className={`mc-badge mc-badge-${alert.level}`}>
              {alert.level}
            </span>
            {/* Status carries a word as well as a colour — colour alone is not
                a label a colour-blind clinician can read. */}
            <span className="mc-badge mc-badge-neutral">
              {alert.status_display}
            </span>
          </div>
          <div className="mc-alertrow-reasons">
            {alert.reasons.slice(0, 2).map((reason) => (
              <span key={reason}>{reason}</span>
            ))}
          </div>
        </div>

        <div className="mc-alertrow-meta">
          <span>{alert.gestational_age || "—"}</span>
          <span>
            {/* Where the alert has climbed to, in words. "Tier 2" means
                nothing to somebody who has not read the policy. */}
            With the {alert.tier_label.toLowerCase()}
          </span>
          {alert.assigned_staff_name ? (
            <span>{alert.assigned_staff_name}</span>
          ) : (
            <span className="mc-queue-unassigned">
              <UserX size={12} strokeWidth={2.2} aria-hidden />
              No clinician
            </span>
          )}
          {next ? (
            <span className={next.overdue ? "is-stale" : "mc-alertrow-next"}>
              Escalates {next.text}
            </span>
          ) : (
            <span>Raised {since(alert.raised_at)}</span>
          )}
        </div>

        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden
          className={`mc-alertrow-chev${open ? " is-open" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <AlertTrail alert={alert} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** The record of who was told and when. Fetched only when a row is opened. */
function AlertTrail({ alert }: { alert: Alert }) {
  const { isClinician } = usePortal();
  const detail = useAlert(alert.id);
  const acknowledge = useAcknowledgeAlert();
  const resolve = useResolveAlert();

  const events: AlertEvent[] = detail.data?.events ?? [];
  const busy = acknowledge.isPending || resolve.isPending;
  const failed = acknowledge.error ?? resolve.error;

  return (
    <div className="mc-trail-wrap">
      {detail.isPending && <div className="mc-hint">Loading history…</div>}

      {detail.isSuccess && (
        <ol className="mc-trail">
          {events.map((event) => (
            <li key={event.id} className="mc-trail-item">
              <span className="mc-trail-dot" aria-hidden />
              <div>
                <div className="mc-trail-what">
                  {event.kind_display}
                  {event.tier_label && ` — ${event.tier_label.toLowerCase()}`}
                </div>
                <div className="mc-trail-detail">{event.detail}</div>
                <div className="mc-trail-when">
                  {new Date(event.created_at).toLocaleString()}
                  {event.actor_name && ` · ${event.actor_name}`}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {failed && (
        <p className="mc-alert mc-alert-error">{(failed as Error).message}</p>
      )}

      <div className="mc-trail-actions">
        <Link
          href={`/dashboard/patients/${alert.patient_id}`}
          className="mc-btn mc-btn-ghost mc-btn-sm"
        >
          Open patient
        </Link>

        {isClinician && alert.status === "open" && (
          <button
            type="button"
            className="mc-btn mc-btn-sm"
            disabled={busy}
            onClick={() => acknowledge.mutate(alert.id)}
          >
            <Check size={14} strokeWidth={2.2} aria-hidden />
            {acknowledge.isPending ? "Acknowledging…" : "Acknowledge"}
          </button>
        )}

        {isClinician && alert.status !== "resolved" && (
          <>
            <button
              type="button"
              className="mc-btn mc-btn-ghost mc-btn-sm"
              disabled={busy}
              onClick={() =>
                resolve.mutate({ alertId: alert.id, resolution: "recovered" })
              }
            >
              Resolve — recovered
            </button>
            <button
              type="button"
              className="mc-btn mc-btn-ghost mc-btn-sm"
              disabled={busy}
              onClick={() =>
                resolve.mutate({ alertId: alert.id, resolution: "handled" })
              }
            >
              Resolve — handled
            </button>
          </>
        )}
      </div>

      {isClinician && alert.status === "open" && (
        <p className="mc-hint">
          Acknowledging stops the escalation ladder — it records that somebody
          has taken responsibility, not that the patient is well.
        </p>
      )}

      {!isClinician && alert.status !== "resolved" && (
        /* Not a permission notice for its own sake. Somebody has to answer
           this, and the useful thing to tell an administrator is who — and
           that an unanswered alert is a fact about cover, not clutter. */
        <p className="mc-hint">
          Answering an alert is a clinical act, so it is left to the
          {alert.assigned_staff_name
            ? ` clinician assigned to this patient, ${alert.assigned_staff_name}.`
            : " clinical team — nobody is assigned to this patient."}{" "}
          Alerts nobody answers keep climbing, and stay here.
        </p>
      )}
    </div>
  );
}
