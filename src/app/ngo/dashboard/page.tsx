"use client";

import { BarChart3, FolderKanban, Users } from "lucide-react";

import { useNGODashboard } from "@/features/ngo/hooks/useNGODashboard";
import { useNgoBandSummary } from "@/features/ngo/hooks/useNgoBands";

export default function NgoDashboardPage() {
  const { data } = useNGODashboard();
  const { data: bands } = useNgoBandSummary();

  const cards = [
    {
      label: "Programs",
      value: data && `${data.activePrograms} Active Programs`,
      Icon: FolderKanban,
    },
    {
      label: "Beneficiaries",
      value: data && `${data.registeredBeneficiaries} Registered`,
      Icon: Users,
    },
    {
      label: "Reports",
      value: data && `${data.reportsAvailable} Reports Available`,
      Icon: BarChart3,
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">NGO Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Welcome to the MomCare NGO portal.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Icon size={15} aria-hidden />
              {label}
            </div>
            <p className="mt-3 text-xl font-bold text-slate-900">
              {value ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Band program
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["In stock", bands?.inStock],
          ["Deployed", bands?.deployed],
          ["Needs attention", bands?.needsAttention],
          ["Pending applications", bands?.pendingApplications],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {value ?? "�"}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        NGO programs and beneficiary management will appear here. (Placeholder
        data — not connected to any live system.)
      </p>
    </>
  );
}
