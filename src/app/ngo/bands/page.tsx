"use client";

import { useState } from "react";

import { useNgoBands } from "@/features/ngo/hooks/useNgoBands";
import type { BandStatus } from "@/features/ngo/types";

const STATUS: Record<BandStatus, { label: string; cls: string }> = {
  in_stock: { label: "In stock", cls: "bg-slate-100 text-slate-700" },
  deployed: { label: "Deployed", cls: "bg-emerald-50 text-emerald-700" },
  offline: { label: "Offline", cls: "bg-amber-50 text-amber-800" },
  low_battery: { label: "Low battery", cls: "bg-amber-50 text-amber-800" },
  returned: { label: "Returned", cls: "bg-teal-50 text-teal-700" },
  retired: { label: "Retired", cls: "bg-red-50 text-red-700" },
};

export default function NgoBandsPage() {
  const { data, isLoading } = useNgoBands();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BandStatus | "all">("all");

  const q = query.trim().toLowerCase();
  const rows = data?.filter(
    (b) =>
      (status === "all" || b.status === status) &&
      (!q ||
        b.serial.toLowerCase().includes(q) ||
        (b.holderName ?? "").toLowerCase().includes(q))
  );

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Bands</h1>
      <p className="mt-1 text-sm text-slate-500">
        Inventory of NGO-owned health bands. Shows status only — no clinical
        data.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search serial or holder"
          aria-label="Search bands"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-600 sm:w-72"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BandStatus | "all")}
          aria-label="Filter by status"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-600"
        >
          <option value="all">All statuses</option>
          {(Object.keys(STATUS) as BandStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS[s].label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Serial</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Battery</th>
              <th className="px-4 py-3">Held by</th>
              <th className="px-4 py-3">Hospital</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  Loading…
                </td>
              </tr>
            )}
            {rows?.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  No bands match.
                </td>
              </tr>
            )}
            {rows?.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {b.serial}
                </td>
                <td className="px-4 py-3 text-slate-600">{b.batch}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS[b.status].cls}`}
                  >
                    {STATUS[b.status].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {b.batteryPercent === null ? "—" : `${b.batteryPercent}%`}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {b.holderName ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {b.hospitalName ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
