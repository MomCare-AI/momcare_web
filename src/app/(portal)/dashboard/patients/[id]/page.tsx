"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import { SessionExpiredError } from "@/core/api/authFetch";
import {
  useClinicians,
  usePatient,
  usePregnancies,
  useUpdatePatient,
  useUpdatePregnancy,
} from "@/features/patients/hooks/usePatients";
import {
  RISK_FACTORS,
  pregnancyTone,
  type PatientDetail,
  type Pregnancy,
} from "@/features/patients/types";
import { useSecondaryProviders } from "@/features/secondary-providers/hooks/useSecondaryProviders";
import { RiskPanel } from "@/features/monitoring/components/RiskPanel";
import { RiskAssessmentInput } from "@/features/monitoring/components/RiskAssessmentInput";
import { VitalsPanel } from "@/features/monitoring/components/VitalsPanel";
import { MonitoringNotesPanel } from "@/features/patients/components/MonitoringNotesPanel";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pair } from "@/shared/ui/Pair";
import { usePortal } from "../../layout";
import { usePageTitle } from "@/hooks/usePageTitle";

type Tab = "overview" | "risk" | "pregnancy" | "notes" | "history" | "consent";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "risk", label: "AI Risk Assessment" },
  { id: "pregnancy", label: "Pregnancy" },
  { id: "notes", label: "Notes" },
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
  const { isClinician, isHospitalAdmin } = usePortal();

  const [tab, setTab] = useState<Tab>("overview");

  const patientQuery = usePatient(id);
  const pregnancyQuery = usePregnancies(id);

  const patient = patientQuery.data;
  const pregnancies = pregnancyQuery.data ?? [];
  const error = patientQuery.error ?? pregnancyQuery.error;

  usePageTitle(patient?.full_name ?? "Patient");

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
  // A convenience for showing/hiding the edit form — the server re-checks
  // whoever actually submits the PATCH, this only decides what's worth
  // putting on screen. Matches who can set these fields at enrollment.
  const canManageCareTeam = isHospitalAdmin || isClinician;

  return (
    <>
      {justEnrolled && (
        <p className="mc-alert mc-alert-success">
          <CheckCircle2 size={15} strokeWidth={2} aria-hidden />
          {patient.full_name} enrolled — medical record number{" "}
          <strong>{patient.mrn}</strong>.
        </p>
      )}

      {/* An unassigned — or departed — provider is a silent failure: the record
          looks complete, but nobody is accountable and her alerts would have
          nowhere to go. It has to be visible on the patient's own screen. */}
      {current && !current.has_responsible_clinician && (
        <p className="mc-alert mc-alert-notice">
          <AlertTriangle size={15} strokeWidth={2} aria-hidden />
          {current.provider
            ? `${current.provider_name || "The assigned provider"} is no longer active at this hospital, so nobody is currently responsible for this pregnancy. Assign a replacement.`
            : "No provider is responsible for this pregnancy. Assign one so alerts have somewhere to go."}
        </p>
      )}

      <div className="mc-subnav">
        <div className="mc-subnav-trail">
          <Link href="/dashboard/patients">Patients</Link>
          <span aria-hidden>/</span>
          <strong>{patient.full_name}</strong>
        </div>

        <nav className="mc-subnav-tabs" aria-label="Patient sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className="mc-subnav-tab"
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mc-subnav-aside">
          {current ? (
            <>
              <span className="mc-ga">{current.gestational_age_display}</span>
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

      <div className="mc-head">
        <div>
          <h1 className="mc-h1">{patient.full_name}</h1>
          <p className="mc-sub">
            {[patient.mrn, patient.phone, patient.cnic]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

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

          <SecondaryProviderEditor
            patient={patient}
            canWrite={canManageCareTeam}
          />

          {current && <VitalsPanel pregnancyId={current.id} />}
        </>
      )}

      {tab === "risk" && (
        <>
          {current ? (
            <>
              <RiskPanel pregnancyId={current.id} canVerify={isClinician} />
              <RiskAssessmentInput
                pregnancyId={current.id}
                patientName={patient.full_name}
              />
            </>
          ) : (
            <div className="mc-card">
              <EmptyState
                title="No active pregnancy"
                text="Risk assessment needs an active pregnancy to score against."
              />
            </div>
          )}
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
              </div>

              <div style={{ marginTop: 22 }}>
                <div className="mc-card-title" style={{ marginBottom: 10 }}>
                  Obstetric history
                </div>
                <div className="mc-risklist">
                  {RISK_FACTORS.map(({ field, label }) => {
                    const answer = current[field];
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

              {current.notes && (
                <div style={{ marginTop: 20 }}>
                  <div className="mc-pair-label">Notes</div>
                  <p className="mc-pair-value">{current.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Activity size={20} strokeWidth={1.9} aria-hidden />}
              title="No active pregnancy"
              text="Past pregnancies, if any, are listed under History."
            />
          )}
        </section>
      )}

      {tab === "pregnancy" && current && (
        <CareTeamEditor
          patientId={patient.id}
          pregnancy={current}
          canWrite={canManageCareTeam}
        />
      )}

      {tab === "notes" && <MonitoringNotesPanel patientId={patient.id} />}

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
            <EmptyState title="Nothing recorded" />
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
                        p.present_factors.length
                          ? `${p.present_factors.length} risk factor(s)`
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
              <div className="mc-card-title">Consent</div>
              <div className="mc-card-sub">
                A single date, not an event log — recorded once, not mandatory
                to enrol.
              </div>
            </div>
          </div>
          <div className="mc-card-body">
            {patient.consent_date ? (
              <Pair
                label="Consent recorded"
                value={formatDate(patient.consent_date)}
              />
            ) : (
              <EmptyState title="No consent recorded yet" />
            )}
          </div>
        </section>
      )}
    </>
  );
}

/**
 * The referring clinician outside this hospital, if any — a patient-level
 * fact (not tied to any one pregnancy), so it lives on Overview rather than
 * inside the pregnancy tab's Care Team card.
 */
function SecondaryProviderEditor({
  patient,
  canWrite,
}: {
  patient: PatientDetail;
  canWrite: boolean;
}) {
  const { data } = useSecondaryProviders();
  const providers = data?.results ?? [];
  const [value, setValue] = useState(patient.secondary_provider ?? "");
  const [saved, setSaved] = useState(false);
  const update = useUpdatePatient(patient.id);

  const dirty = value !== (patient.secondary_provider ?? "");

  const save = () => {
    setSaved(false);
    update.mutate(
      { secondary_provider: value || null },
      { onSuccess: () => setSaved(true) }
    );
  };

  return (
    <section className="mc-card" style={{ marginTop: 18 }}>
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Secondary provider</div>
          <div className="mc-card-sub">
            An external clinician she also sees — a referring doctor or a
            specialist elsewhere.
          </div>
        </div>
      </div>
      <div className="mc-card-body">
        <label className="mc-label" htmlFor="secondary-provider">
          Secondary provider
        </label>
        <select
          id="secondary-provider"
          className="mc-input"
          value={value}
          disabled={!canWrite}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">None</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.affiliation && ` · ${p.affiliation}`}
            </option>
          ))}
        </select>

        {update.isError && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
            {update.error instanceof Error
              ? update.error.message
              : "Could not save this."}
          </p>
        )}
        {saved && !update.isPending && !dirty && (
          <p className="mc-alert mc-alert-success" style={{ marginTop: 12 }}>
            Saved.
          </p>
        )}

        {canWrite && (
          <button
            type="button"
            className="mc-btn mc-btn-sm"
            style={{ marginTop: 14 }}
            disabled={!dirty || update.isPending}
            onClick={save}
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
        )}
      </div>
    </section>
  );
}

/**
 * Provider/nurse/care_manager, editable directly on the pregnancy — there is
 * no separate care-team resource any more. Same role-filtered select pattern
 * as enrollment, so assigning someone here can't produce a value the server
 * would reject for a role mismatch.
 */
function CareTeamEditor({
  patientId,
  pregnancy,
  canWrite,
}: {
  patientId: string;
  pregnancy: Pregnancy;
  canWrite: boolean;
}) {
  const { data: clinicians = [] } = useClinicians();
  const providers = clinicians.filter((c) => c.role_code === "provider");
  const nurses = clinicians.filter((c) => c.role_code === "nurse");
  const careManagers = clinicians.filter((c) => c.role_code === "care_manager");

  const [provider, setProvider] = useState(pregnancy.provider ?? "");
  const [nurse, setNurse] = useState(pregnancy.nurse ?? "");
  const [careManager, setCareManager] = useState(pregnancy.care_manager ?? "");
  const [saved, setSaved] = useState(false);

  const update = useUpdatePregnancy(patientId, pregnancy.id);

  const dirty =
    provider !== (pregnancy.provider ?? "") ||
    nurse !== (pregnancy.nurse ?? "") ||
    careManager !== (pregnancy.care_manager ?? "");

  const save = () => {
    setSaved(false);
    update.mutate(
      {
        provider: provider || null,
        nurse: nurse || null,
        care_manager: careManager || null,
      },
      { onSuccess: () => setSaved(true) }
    );
  };

  return (
    <section className="mc-card" style={{ marginTop: 18 }}>
      <div className="mc-card-head">
        <div>
          <div className="mc-card-title">Care team</div>
          <div className="mc-card-sub">
            The provider is the accountable lead — what alert escalation routes
            to.
          </div>
        </div>
      </div>
      <div className="mc-card-body">
        <div className="mc-formgrid">
          <div>
            <label className="mc-label" htmlFor="ct-provider">
              Provider
            </label>
            <select
              id="ct-provider"
              className="mc-input"
              value={provider}
              disabled={!canWrite}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="">Not assigned</option>
              {providers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mc-label" htmlFor="ct-nurse">
              Nurse
            </label>
            <select
              id="ct-nurse"
              className="mc-input"
              value={nurse}
              disabled={!canWrite}
              onChange={(e) => setNurse(e.target.value)}
            >
              <option value="">Not assigned</option>
              {nurses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mc-label" htmlFor="ct-care-manager">
              Care manager
            </label>
            <select
              id="ct-care-manager"
              className="mc-input"
              value={careManager}
              disabled={!canWrite}
              onChange={(e) => setCareManager(e.target.value)}
            >
              <option value="">Not assigned</option>
              {careManagers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {update.isError && (
          <p className="mc-alert mc-alert-error" style={{ marginTop: 12 }}>
            {update.error instanceof Error
              ? update.error.message
              : "Could not save the care team."}
          </p>
        )}
        {saved && !update.isPending && !dirty && (
          <p className="mc-alert mc-alert-success" style={{ marginTop: 12 }}>
            Saved.
          </p>
        )}

        {canWrite && (
          <button
            type="button"
            className="mc-btn mc-btn-sm"
            style={{ marginTop: 14 }}
            disabled={!dirty || update.isPending}
            onClick={save}
          >
            {update.isPending ? "Saving…" : "Save care team"}
          </button>
        )}
      </div>
    </section>
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
