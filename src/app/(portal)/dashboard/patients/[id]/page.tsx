"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";

import { SessionExpiredError } from "@/core/api/authFetch";
import {
  usePatient,
  usePregnancies,
} from "@/features/patients/hooks/usePatients";
import { RISK_FACTORS, pregnancyTone } from "@/features/patients/types";

type Tab = "overview" | "pregnancy" | "history" | "consent";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "pregnancy", label: "Pregnancy" },
  { id: "history", label: "History" },
  { id: "consent", label: "Consent" },
];

export default function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const justEnrolled = useSearchParams().get("enrolled") === "1";

  const [tab, setTab] = useState<Tab>("overview");

  const patientQuery = usePatient(id);
  const pregnancyQuery = usePregnancies(id);

  const patient = patientQuery.data;
  const pregnancies = pregnancyQuery.data ?? [];
  const error = patientQuery.error ?? pregnancyQuery.error;

  useEffect(() => {
    if (error instanceof SessionExpiredError) router.replace("/login");
  }, [error, router]);

  if (patientQuery.isPending)
    return <div className="mc-loading">Loading patient…</div>;

  if (error || !patient) {
    return (
      <>
        <Link href="/dashboard/patients" className="mc-link">
          <ArrowLeft size={14} strokeWidth={2} aria-hidden /> Patients
        </Link>
        <p className="mc-alert mc-alert-error" style={{ marginTop: 16 }}>
          <AlertCircle size={15} strokeWidth={2} aria-hidden />
          {error instanceof Error ? error.message : "Patient not found."}
        </p>
      </>
    );
  }

  const current = patient.current_pregnancy;

  return (
    <>
      {justEnrolled && (
        <p className="mc-alert mc-alert-success">
          <CheckCircle2 size={15} strokeWidth={2} aria-hidden />
          {patient.full_name} enrolled — medical record number{" "}
          <strong>{patient.mrn}</strong>.
        </p>
      )}

      {/* An unassigned — or departed — clinician is a silent failure: the record
          looks complete, but nobody is accountable and her alerts would have
          nowhere to go. It has to be visible on the patient's own screen. */}
      {current && !current.has_responsible_clinician && (
        <p className="mc-alert mc-alert-notice">
          <AlertTriangle size={15} strokeWidth={2} aria-hidden />
          {current.assigned_staff
            ? `${current.assigned_staff_name || "The assigned clinician"} is no longer active at this hospital, so nobody is currently responsible for this pregnancy. Assign a replacement.`
            : "No clinician is responsible for this pregnancy. Assign one so alerts have somewhere to go."}
        </p>
      )}

      <div className="mc-head">
        <div>
          <Link href="/dashboard/patients" className="mc-link">
            <ArrowLeft size={14} strokeWidth={2} aria-hidden /> Patients
          </Link>
          <h1 className="mc-h1" style={{ marginTop: 8 }}>
            {patient.full_name}
          </h1>
          <p className="mc-sub">
            {[patient.mrn, patient.phone, patient.cnic]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="mc-head-badges">
          {current ? (
            <>
              <span className="mc-ga mc-ga-lg">
                {current.gestational_age_display}
              </span>
              <span
                className={`mc-badge mc-badge-${pregnancyTone(current.status)}`}
              >
                {current.status_display}
              </span>
            </>
          ) : (
            <span className="mc-badge mc-badge-neutral">
              No active pregnancy
            </span>
          )}
        </div>
      </div>

      <nav className="mc-tabs" aria-label="Patient sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="mc-tab"
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <>
          <section className="mc-card">
            <div className="mc-card-head">
              <div className="mc-card-title">Patient details</div>
              {!patient.has_app_account && (
                <span className="mc-badge mc-badge-neutral">
                  No app account
                </span>
              )}
            </div>
            <div className="mc-card-body">
              <div className="mc-pairs">
                <Pair
                  label="Date of birth"
                  value={formatDate(patient.date_of_birth)}
                />
                <Pair label="Blood group" value={patient.blood_group} />
                <Pair label="Phone" value={patient.phone} />
                <Pair label="CNIC" value={patient.cnic} />
                <Pair label="Site" value={patient.location_name} />
                <Pair
                  label="Emergency contact"
                  value={
                    [
                      patient.emergency_contact_name,
                      patient.emergency_contact_relation &&
                        `(${patient.emergency_contact_relation})`,
                      patient.emergency_contact_phone,
                    ]
                      .filter(Boolean)
                      .join(" ") || ""
                  }
                />
              </div>
            </div>
          </section>

          <div className="mc-grid-even">
            <section className="mc-card">
              <div className="mc-card-head">
                <div className="mc-card-title">Vitals</div>
              </div>
              <div className="mc-empty">
                <span className="mc-empty-icon">
                  <HeartPulse size={20} strokeWidth={1.9} aria-hidden />
                </span>
                <span className="mc-empty-title">No readings yet</span>
                <span className="mc-empty-text">
                  Blood pressure, heart rate and temperature will appear here
                  once a monitoring band is paired.
                </span>
              </div>
            </section>

            <section className="mc-card">
              <div className="mc-card-head">
                <div className="mc-card-title">Risk assessment</div>
              </div>
              <div className="mc-empty">
                <span className="mc-empty-icon">
                  <Brain size={20} strokeWidth={1.9} aria-hidden />
                </span>
                <span className="mc-empty-title">Not yet assessed</span>
                <span className="mc-empty-text">
                  Risk scoring runs on incoming readings. Recorded history is
                  shown under Pregnancy.
                </span>
              </div>
            </section>
          </div>
        </>
      )}

      {tab === "pregnancy" && (
        <section className="mc-card">
          <div className="mc-card-head">
            <div className="mc-card-title">Current pregnancy</div>
          </div>
          {current ? (
            <div className="mc-card-body">
              <div className="mc-pairs">
                <Pair
                  label="Gestational age"
                  value={current.gestational_age_display}
                />
                <Pair
                  label="Estimated delivery"
                  value={formatDate(current.edd)}
                />
                <Pair
                  label="Dating method"
                  value={current.edd_source_display}
                />
                <Pair
                  label="Last menstrual period"
                  value={formatDate(current.lmp)}
                />
                <Pair
                  label="Gravida / Para"
                  value={
                    current.gravida !== null || current.para !== null
                      ? `G${current.gravida ?? "?"} P${current.para ?? "?"}`
                      : ""
                  }
                />
                <Pair
                  label="Lead clinician"
                  value={
                    current.assigned_staff_name
                      ? current.assigned_staff_is_active
                        ? current.assigned_staff_name
                        : `${current.assigned_staff_name} (no longer active)`
                      : ""
                  }
                />
              </div>

              {current.risk_factors && (
                <div style={{ marginTop: 22 }}>
                  <div className="mc-card-title" style={{ marginBottom: 10 }}>
                    Obstetric history
                  </div>
                  <div className="mc-risklist">
                    {RISK_FACTORS.map(({ field, label }) => {
                      const answer = current.risk_factors![field];
                      return (
                        <div key={field} className="mc-riskrow">
                          <span className="mc-riskrow-label">{label}</span>
                          <span
                            className={`mc-badge mc-badge-${
                              answer === "yes"
                                ? "high"
                                : answer === "no"
                                  ? "stable"
                                  : "neutral"
                            }`}
                          >
                            {answer === "yes"
                              ? "Yes"
                              : answer === "no"
                                ? "No"
                                : "Not asked"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {current.notes && (
                <div style={{ marginTop: 20 }}>
                  <div className="mc-pair-label">Clinical notes</div>
                  <p className="mc-pair-value">{current.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mc-empty">
              <span className="mc-empty-icon">
                <Activity size={20} strokeWidth={1.9} aria-hidden />
              </span>
              <span className="mc-empty-title">No active pregnancy</span>
              <span className="mc-empty-text">
                Past pregnancies, if any, are listed under History.
              </span>
            </div>
          )}
        </section>
      )}

      {tab === "history" && (
        <section className="mc-card">
          <div className="mc-card-head">
            <div>
              <div className="mc-card-title">Pregnancy history</div>
              <div className="mc-card-sub">
                Kept permanently — a previous complication is among the
                strongest predictors of the next pregnancy.
              </div>
            </div>
          </div>
          {pregnancies.length === 0 ? (
            <div className="mc-empty">
              <span className="mc-empty-title">Nothing recorded</span>
            </div>
          ) : (
            <div className="mc-rows">
              {pregnancies.map((p) => (
                <div key={p.id} className="mc-row">
                  <div className="mc-row-main">
                    <div className="mc-row-title">
                      {p.edd ? new Date(p.edd).getFullYear() : "Undated"} ·{" "}
                      {p.status_display}
                    </div>
                    <div className="mc-row-meta">
                      {[
                        p.edd && `EDD ${formatDate(p.edd)}`,
                        p.gravida !== null && `G${p.gravida}`,
                        p.para !== null && `P${p.para}`,
                        p.risk_factors?.present_factors.length
                          ? `${p.risk_factors.present_factors.length} risk factor(s)`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  {p.status === "active" && (
                    <span className="mc-ga">{p.gestational_age_display}</span>
                  )}
                  <span
                    className={`mc-badge mc-badge-${pregnancyTone(p.status)}`}
                  >
                    {p.status_display}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "consent" && (
        <section className="mc-card">
          <div className="mc-card-head">
            <div>
              <div className="mc-card-title">Consent record</div>
              <div className="mc-card-sub">
                Append-only — a change of mind adds an entry, it never
                overwrites one.
              </div>
            </div>
          </div>
          {patient.consents.length === 0 ? (
            <div className="mc-empty">
              <span className="mc-empty-title">No consent recorded</span>
            </div>
          ) : (
            <div className="mc-rows">
              {patient.consents.map((c) => (
                <div key={c.id} className="mc-row">
                  <div className="mc-row-main">
                    <div className="mc-row-title">
                      {c.status_display} · policy {c.version}
                    </div>
                    <div className="mc-row-meta">
                      {c.method_display}
                      {c.recorded_by_name &&
                        ` · recorded by ${c.recorded_by_name}`}
                      {` · ${new Date(c.recorded_at).toLocaleString()}`}
                      {c.note && ` · ${c.note}`}
                    </div>
                  </div>
                  <span
                    className={`mc-badge mc-badge-${
                      c.status === "granted" ? "stable" : "neutral"
                    }`}
                  >
                    <ShieldCheck size={12} strokeWidth={2.2} aria-hidden />
                    {c.status_display}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

function Pair({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="mc-pair-label">{label}</div>
      <div className="mc-pair-value">{value || "—"}</div>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
