"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { useBandAction } from "../hooks/useNgoBands";
import type { BandEventType, NgoBand } from "../types";
import { BAND_STATUS } from "./bandStatus";

const EVENT_LABEL: Record<BandEventType, string> = {
  added: "Added to stock",
  allocated: "Allocated",
  recall_requested: "Recall requested",
  returned: "Returned",
  restocked: "Restocked",
  retired: "Retired",
};

type Step = "recall" | "retire" | null;

/** Right-hand detail panel: band facts, lifecycle actions, and its history. */
export function BandDrawer({
  band,
  onClose,
}: {
  band: NgoBand;
  onClose: () => void;
}) {
  const act = useBandAction();
  const [step, setStep] = useState<Step>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const inField =
    band.status === "deployed" ||
    band.status === "offline" ||
    band.status === "low_battery" ||
    band.status === "recall_pending";
  const canRecall = inField && band.status !== "recall_pending";
  const canRetire = band.status === "in_stock" || band.status === "returned";

  const run = (a: Parameters<typeof act.mutate>[0]) =>
    act.mutate(a, {
      onSuccess: () => {
        setStep(null);
        setReason("");
      },
    });

  const btn =
    "rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 transition-colors";
  const status = BAND_STATUS[band.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Band ${band.serial}`}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{band.serial}</h2>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${status.cls}`}
            >
              {status.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-4 p-5 text-sm">
          {[
            ["Batch", band.batch],
            [
              "Battery",
              band.batteryPercent === null ? "—" : `${band.batteryPercent}%`,
            ],
            ["Held by", band.holderName ?? "—"],
            ["Hospital", band.hospitalName ?? "—"],
            [
              "Last sync",
              band.lastSyncAt
                ? new Date(band.lastSyncAt).toLocaleString()
                : "Never",
            ],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {k}
              </dt>
              <dd className="mt-1 text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-3 border-t border-slate-200 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Actions
          </h3>

          {act.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {act.error.message}
            </p>
          )}

          {step ? (
            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-slate-700"
              >
                {step === "recall"
                  ? "Why is this band being recalled?"
                  : "Why is this band being retired? This cannot be undone."}
              </label>
              <input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-600"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    act.isPending || (step === "retire" && !reason.trim())
                  }
                  onClick={() => run({ kind: step, id: band.id, reason })}
                  className={`${btn} ${
                    step === "retire"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                >
                  {step === "recall" ? "Confirm recall" : "Retire band"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(null);
                    setReason("");
                  }}
                  className={`${btn} border border-slate-200 text-slate-700 hover:bg-white`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {canRecall && (
                <button
                  type="button"
                  onClick={() => setStep("recall")}
                  className={`${btn} border border-slate-200 text-slate-700 hover:bg-slate-50`}
                >
                  Request recall
                </button>
              )}
              {inField && (
                <button
                  type="button"
                  disabled={act.isPending}
                  onClick={() => run({ kind: "returned", id: band.id })}
                  className={`${btn} bg-teal-600 text-white hover:bg-teal-700`}
                >
                  Mark returned
                </button>
              )}
              {band.status === "returned" && (
                <button
                  type="button"
                  disabled={act.isPending}
                  onClick={() => run({ kind: "restock", id: band.id })}
                  className={`${btn} bg-teal-600 text-white hover:bg-teal-700`}
                >
                  Restock
                </button>
              )}
              {canRetire && (
                <button
                  type="button"
                  onClick={() => setStep("retire")}
                  className={`${btn} border border-red-200 text-red-700 hover:bg-red-50`}
                >
                  Retire
                </button>
              )}
              {band.status === "retired" && (
                <p className="text-sm text-slate-500">
                  This band is retired and cannot be changed.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            History
          </h3>
          <ol className="mt-3 space-y-3">
            {[...band.events].reverse().map((e) => (
              <li key={e.id} className="text-sm">
                <p className="font-medium text-slate-900">
                  {EVENT_LABEL[e.type]}
                </p>
                <p className="text-slate-600">{e.note}</p>
                <p className="text-xs text-slate-400">
                  {new Date(e.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
