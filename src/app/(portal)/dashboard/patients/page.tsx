"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  UserPlus,
  Users,
} from "lucide-react";

import { SessionExpiredError } from "@/core/api/authFetch";
import {
  usePatientList,
  useWorklist,
} from "@/features/patients/hooks/usePatients";
import { WorklistPanel } from "@/features/patients/components/WorklistPanel";
import { RiskBadge } from "@/features/monitoring/components/RiskBadge";
import { pregnancyTone } from "@/features/patients/types";
import { InitialsAvatar } from "@/shared/ui/InitialsAvatar";
import { usePortal } from "../layout";
import { usePageTitle } from "@/hooks/usePageTitle";

/** Per role_code — what this page is called and what an empty list means.
 *  hospital_admin sees the whole hospital and isn't in this map. */
const WORKSPACE_COPY: Record<
  string,
  { title: string; subtitle: (count: number) => string; empty: string }
> = {
  provider: {
    title: "My Patients",
    subtitle: (n) => `${n} under your care`,
    empty: "No patients are assigned to you yet.",
  },
  nurse: {
    title: "Assigned Patients",
    subtitle: (n) => `${n} assigned to you`,
    empty: "No patients are assigned to you yet.",
  },
  care_manager: {
    title: "Patients I Coordinate",
    subtitle: (n) => `${n} you're coordinating`,
    empty: "You're not coordinating any patients yet.",
  },
};

export default function PatientsPage() {
  const { isHospitalAdmin, isClinician, user } = usePortal();
  const router = useRouter();

  // Admin sees the whole hospital, unfiltered — matches the master plan's
  // nav table (§20): "All Patients" for hospital_admin, "My/Assigned/
  // Coordinated Patients" (same route, query-filtered) for the other three
  // clinical roles. Backend already implements the corrected lead-OR-
  // co-provider query — see core/patients/api/views.py:_scope_to_assigned.
  const assignedToMe = isClinician && !isHospitalAdmin;
  const workspace = WORKSPACE_COPY[user.role_code];
  usePageTitle(workspace?.title ?? "Patients");

  // "Patients" is the list; "Worklist" is administrative/care-continuity
  // gaps (no recent reading, no recent note, no risk history answered, no
  // lead clinician) - deliberately a different question from clinical
  // severity, so it's a separate tab rather than merged into the list
  // above. See docs/worklist-feature-scope.md.
  const [tab, setTab] = useState<"patients" | "worklist">("patients");
  const worklist = useWorklist(assignedToMe);

  // Seeds from ?search=, so the navbar search box can land here with a
  // result already showing rather than an empty box to retype into.
  const initialSearch = useSearchParams().get("search") ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [query, setQuery] = useState(initialSearch);
  const [page, setPage] = useState(1);

  // Searching and paging happen on the server — the browser never receives
  // rows it would then filter away.
  const { data, isPending, error } = usePatientList(query, page, assignedToMe);

  // An expired session is a routing concern, not something to render.
  useEffect(() => {
    if (error instanceof SessionExpiredError) router.replace("/login");
  }, [error, router]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const patients = data?.results ?? [];
  const count = data?.count ?? 0;
  const totalPages = data?.total_pages || 1;
  const isSearching = query.length > 0;

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">{workspace?.title ?? "Patients"}</h1>
          <p className="mc-sub">
            {isSearching
              ? `${count} matching "${query}"`
              : workspace
                ? workspace.subtitle(count)
                : `${count} enrolled at this hospital`}
          </p>
        </div>
        <Link href="/dashboard/patients/new" className="mc-btn">
          <UserPlus size={15} strokeWidth={2} aria-hidden />
          Enrol patient
        </Link>
      </div>

      <div className="mc-tabs" role="tablist" aria-label="Patients or worklist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "patients"}
          aria-current={tab === "patients" ? "page" : undefined}
          className="mc-tab"
          onClick={() => setTab("patients")}
        >
          Patients
          <span className="mc-tab-count">{count}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "worklist"}
          aria-current={tab === "worklist" ? "page" : undefined}
          className="mc-tab"
          onClick={() => setTab("worklist")}
        >
          Worklist
          <span className="mc-tab-count">{worklist.data?.count ?? 0}</span>
        </button>
      </div>

      {tab === "worklist" ? (
        <section className="mc-card">
          <div className="mc-card-body">
            <p className="mc-hint" style={{ marginBottom: 14 }}>
              Cases missing a recent reading, a recent note, an answered risk
              history, or a lead clinician — not a statement about clinical
              severity. See Needs attention for that.
            </p>
            <WorklistPanel assignedToMe={assignedToMe} />
          </div>
        </section>
      ) : isPending ? (
        <div className="mc-loading">Loading patients…</div>
      ) : (
        <>
          {error && !(error instanceof SessionExpiredError) && (
            <p className="mc-alert mc-alert-error">
              <AlertCircle size={15} strokeWidth={2} aria-hidden />
              {error instanceof Error
                ? error.message
                : "Could not load patients."}
            </p>
          )}

          <form onSubmit={submitSearch} className="mc-searchbar">
            <Search
              size={16}
              strokeWidth={2}
              aria-hidden
              className="mc-searchbar-icon"
            />
            <input
              className="mc-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, CNIC or MRN"
              aria-label="Search patients"
            />
            <button type="submit" className="mc-btn">
              Search
            </button>
            {isSearching && (
              <button
                type="button"
                className="mc-btn-ghost"
                onClick={() => {
                  setSearch("");
                  setQuery("");
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}
          </form>

          <section className="mc-card">
            {patients.length === 0 ? (
              <div className="mc-empty">
                <span className="mc-empty-icon">
                  <Users size={20} strokeWidth={1.9} aria-hidden />
                </span>
                <span className="mc-empty-title">
                  {isSearching
                    ? "No matching patients"
                    : workspace
                      ? `No patients yet`
                      : "No patients enrolled yet"}
                </span>
                <span className="mc-empty-text">
                  {isSearching
                    ? "Try a phone number, CNIC or medical record number."
                    : workspace
                      ? workspace.empty
                      : "Enrol your first patient to start tracking her pregnancy."}
                </span>
                {!isSearching && (
                  <span className="mc-empty-actions">
                    <Link href="/dashboard/patients/new" className="mc-btn">
                      <UserPlus size={15} strokeWidth={2} aria-hidden />
                      Enrol patient
                    </Link>
                  </span>
                )}
              </div>
            ) : (
              <div className="mc-rows">
                {patients.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/patients/${p.id}`}
                    className="mc-row mc-row-link"
                  >
                    <InitialsAvatar name={p.full_name} />
                    <div className="mc-row-main">
                      <div className="mc-row-title">{p.full_name}</div>
                      <div className="mc-row-meta">
                        {[p.mrn, p.phone, p.cnic].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    {p.gestational_age_display && (
                      <span className="mc-ga">{p.gestational_age_display}</span>
                    )}
                    {p.pregnancy_status === "active" ? (
                      /* Risk is what decides which row to open first, so for an
                         active pregnancy it replaces the status badge rather than
                         crowding in beside it. */
                      <RiskBadge level={p.risk_level} />
                    ) : p.pregnancy_status ? (
                      <span
                        className={`mc-badge mc-badge-${pregnancyTone(p.pregnancy_status)}`}
                      >
                        No active pregnancy
                      </span>
                    ) : (
                      <span className="mc-badge mc-badge-neutral">
                        No pregnancy recorded
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mc-card-foot mc-pager">
                <button
                  className="mc-btn-ghost mc-btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} strokeWidth={2} aria-hidden /> Previous
                </button>
                <span className="mc-pager-label">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="mc-btn-ghost mc-btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight size={14} strokeWidth={2} aria-hidden />
                </button>
              </div>
            )}
          </section>

          {!isHospitalAdmin && (
            <p className="mc-sub">
              Enrolment is available to all clinical staff.
            </p>
          )}
        </>
      )}
    </>
  );
}
