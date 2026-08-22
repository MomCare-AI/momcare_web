"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  UserPlus,
  Users,
} from "lucide-react";

import { SessionExpiredError } from "@/core/api/authFetch";
import { listPatients } from "@/features/patients/api";
import { pregnancyTone, type PatientListItem } from "@/features/patients/types";
import { usePortal } from "../layout";

export default function PatientsPage() {
  const { isHospitalAdmin } = usePortal();
  const router = useRouter();

  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Searching and paging happen on the server — the browser never receives
      // rows it would then filter away.
      const data = await listPatients({ search: query, page });
      setPatients(data.results);
      setCount(data.count);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not load patients.");
    } finally {
      setLoading(false);
    }
  }, [query, page, router]);

  useEffect(() => {
    load();
  }, [load]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  if (loading) return <div className="mc-loading">Loading patients…</div>;

  const isSearching = query.length > 0;

  return (
    <>
      <div className="mc-head">
        <div>
          <h1 className="mc-h1">Patients</h1>
          <p className="mc-sub">
            {isSearching
              ? `${count} matching "${query}"`
              : `${count} enrolled at this hospital`}
          </p>
        </div>
        <Link href="/dashboard/patients/new" className="mc-btn">
          <UserPlus size={15} strokeWidth={2} aria-hidden />
          Enrol patient
        </Link>
      </div>

      {error && (
        <p className="mc-alert mc-alert-error">
          <AlertCircle size={15} strokeWidth={2} aria-hidden />
          {error}
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
                : "No patients enrolled yet"}
            </span>
            <span className="mc-empty-text">
              {isSearching
                ? "Try a phone number, CNIC or medical record number."
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
                <div className="mc-row-main">
                  <div className="mc-row-title">{p.full_name}</div>
                  <div className="mc-row-meta">
                    {[p.mrn, p.phone, p.cnic].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {p.gestational_age_display && (
                  <span className="mc-ga">{p.gestational_age_display}</span>
                )}
                {p.pregnancy_status ? (
                  <span
                    className={`mc-badge mc-badge-${pregnancyTone(p.pregnancy_status)}`}
                  >
                    {p.pregnancy_status === "active"
                      ? "Pregnant"
                      : "No active pregnancy"}
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
        <p className="mc-sub">Enrolment is available to all clinical staff.</p>
      )}
    </>
  );
}
