"use client";

import {
  useAllocateBand,
  useDecideApplication,
  useNgoApplications,
} from "@/features/ngo/hooks/useNgoBands";
import type { ApplicationStatus } from "@/features/ngo/types";

const STATUS: Record<ApplicationStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export default function NgoApplicationsPage() {
  const { data, isLoading } = useNgoApplications();
  const decide = useDecideApplication();
  const allocate = useAllocateBand();
  const busy = decide.isPending || allocate.isPending;

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Band applications</h1>
      <p className="mt-1 text-sm text-slate-500">
        Requests for a band from mothers and partner hospitals.
      </p>

      {allocate.error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {allocate.error.message}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
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
            {data?.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {a.applicantName}
                </td>
                <td className="px-4 py-3 text-slate-600">{a.area}</td>
                <td className="px-4 py-3 text-slate-600">
                  {a.source === "mother_app" ? "Mother's app" : "Hospital"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(a.requestedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS[a.status]}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          decide.mutate({ id: a.id, status: "approved" })
                        }
                        className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:bg-slate-300"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          decide.mutate({ id: a.id, status: "rejected" })
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {a.status === "approved" &&
                    (a.allocatedBandSerial ? (
                      <span className="text-xs text-slate-600">
                        Band {a.allocatedBandSerial}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => allocate.mutate(a.id)}
                        className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:bg-slate-300"
                      >
                        Allocate band
                      </button>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
