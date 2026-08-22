"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { SessionExpiredError } from "@/core/api/authFetch";
import {
  enrolPatient,
  listClinicians,
  type EnrolmentInput,
  type StaffOption,
} from "@/features/patients/api";
import {
  BLOOD_GROUPS,
  RISK_FACTORS,
  type RiskAnswer,
  type RiskFactorField,
} from "@/features/patients/types";
import { usePortal } from "../../layout";

const CONSENT_VERSION = "v1.0";

/** LMP + 280 days — mirrors the backend so the nurse sees the due date as she
 *  types, rather than after saving. The server remains authoritative. */
function eddFromLmp(lmp: string): string | null {
  if (!lmp) return null;
  const date = new Date(lmp);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + 280);
  return date.toISOString().slice(0, 10);
}

function gestationalAge(edd: string): string | null {
  if (!edd) return null;
  const due = new Date(edd);
  if (Number.isNaN(due.getTime())) return null;
  const daysElapsed =
    280 - Math.round((due.getTime() - Date.now()) / 86_400_000);
  if (daysElapsed < 0) return "0w 0d";
  return `${Math.floor(daysElapsed / 7)}w ${daysElapsed % 7}d`;
}

export default function EnrolPatientPage() {
  const router = useRouter();
  const { org } = usePortal();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    phone: "",
    cnic: "",
    blood_group: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
  });
  const [recordPregnancy, setRecordPregnancy] = useState(true);
  const [pregnancy, setPregnancy] = useState({
    lmp: "",
    edd: "",
    edd_source: "lmp",
    gravida: "",
    para: "",
    notes: "",
  });
  const [risk, setRisk] = useState<Record<RiskFactorField, RiskAnswer>>(
    () =>
      Object.fromEntries(
        RISK_FACTORS.map((f) => [f.field, "unknown"])
      ) as Record<RiskFactorField, RiskAnswer>
  );
  const [assignedStaff, setAssignedStaff] = useState("");
  const [clinicians, setClinicians] = useState<StaffOption[]>([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentMethod, setConsentMethod] = useState("in_person");

  useEffect(() => {
    // Convenience only — the API scopes this list to the hospital and
    // re-validates the choice on save, so a tampered value cannot get through.
    listClinicians()
      .then(setClinicians)
      .catch(() => setClinicians([]));
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shown live so the person entering the LMP can sanity-check it against what
  // the mother says, instead of discovering a typo weeks later.
  const derivedEdd = useMemo(
    () => pregnancy.edd || eddFromLmp(pregnancy.lmp),
    [pregnancy.lmp, pregnancy.edd]
  );
  const derivedAge = derivedEdd ? gestationalAge(derivedEdd) : null;

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consentGiven) {
      setError("Consent must be recorded before a patient can be enrolled.");
      return;
    }
    if (recordPregnancy && !pregnancy.lmp && !pregnancy.edd) {
      setError(
        "Enter either the last menstrual period or an estimated delivery date — " +
          "without one, gestational age cannot be calculated."
      );
      return;
    }

    const payload: EnrolmentInput = {
      ...form,
      date_of_birth: form.date_of_birth || null,
      consent: {
        status: "granted",
        version: CONSENT_VERSION,
        method: consentMethod,
      },
    };

    if (recordPregnancy) {
      payload.pregnancy = {
        lmp: pregnancy.lmp || null,
        // Only send an EDD the user actually typed; otherwise the server
        // derives it, keeping one authoritative calculation.
        edd: pregnancy.edd || null,
        edd_source: pregnancy.edd ? pregnancy.edd_source : "lmp",
        gravida: pregnancy.gravida ? Number(pregnancy.gravida) : null,
        para: pregnancy.para ? Number(pregnancy.para) : null,
        assigned_staff: assignedStaff || null,
        notes: pregnancy.notes,
        risk_factors: risk,
      };
    }

    setSubmitting(true);
    try {
      const patient = await enrolPatient(payload);
      router.push(`/dashboard/patients/${patient.id}?enrolled=1`);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        router.replace("/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Could not enrol this patient."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mc-head">
        <div>
          <Link href="/dashboard/patients" className="mc-link">
            <ArrowLeft size={14} strokeWidth={2} aria-hidden /> Patients
          </Link>
          <h1 className="mc-h1" style={{ marginTop: 8 }}>
            Enrol a patient
          </h1>
          <p className="mc-sub">
            She will be registered at {org.name}. A medical record number is
            assigned automatically, and an app account is not required.
          </p>
        </div>
      </div>

      <form onSubmit={submit}>
        <section className="mc-card">
          <div className="mc-card-head">
            <div className="mc-card-title">Patient details</div>
          </div>
          <div className="mc-card-body">
            <div className="mc-formgrid">
              <Field label="First name" required>
                <input
                  className="mc-input"
                  required
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                />
              </Field>
              <Field label="Last name">
                <input
                  className="mc-input"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                />
              </Field>
              <Field label="Date of birth">
                <input
                  className="mc-input"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                />
              </Field>
              <Field label="Phone" hint="Used to find her record later">
                <input
                  className="mc-input"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="03001234567"
                />
              </Field>
              <Field label="CNIC" hint="If she has one">
                <input
                  className="mc-input"
                  value={form.cnic}
                  onChange={(e) => set("cnic", e.target.value)}
                  placeholder="61101-1234567-8"
                />
              </Field>
              <Field label="Blood group">
                <select
                  className="mc-input"
                  value={form.blood_group}
                  onChange={(e) => set("blood_group", e.target.value)}
                >
                  <option value="">Not recorded</option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mc-formgrid" style={{ marginBottom: 0 }}>
              <Field label="Emergency contact">
                <input
                  className="mc-input"
                  value={form.emergency_contact_name}
                  onChange={(e) =>
                    set("emergency_contact_name", e.target.value)
                  }
                  placeholder="Name"
                />
              </Field>
              <Field label="Their phone">
                <input
                  className="mc-input"
                  value={form.emergency_contact_phone}
                  onChange={(e) =>
                    set("emergency_contact_phone", e.target.value)
                  }
                />
              </Field>
              <Field label="Relationship">
                <input
                  className="mc-input"
                  value={form.emergency_contact_relation}
                  onChange={(e) =>
                    set("emergency_contact_relation", e.target.value)
                  }
                  placeholder="Husband, mother, sister…"
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="mc-card">
          <div className="mc-card-head">
            <div>
              <div className="mc-card-title">Current pregnancy</div>
              <div className="mc-card-sub">
                Gestational age drives everything else — without a date, no
                reading can be interpreted.
              </div>
            </div>
            <label className="mc-check">
              <input
                type="checkbox"
                checked={recordPregnancy}
                onChange={(e) => setRecordPregnancy(e.target.checked)}
              />
              Record a pregnancy now
            </label>
          </div>

          {recordPregnancy && (
            <div className="mc-card-body">
              <div className="mc-formgrid">
                <Field
                  label="Last menstrual period"
                  hint="First day of her last period"
                >
                  <input
                    className="mc-input"
                    type="date"
                    value={pregnancy.lmp}
                    onChange={(e) =>
                      setPregnancy((p) => ({ ...p, lmp: e.target.value }))
                    }
                  />
                </Field>
                <Field
                  label="Estimated delivery date"
                  hint="Leave blank to calculate from the LMP"
                >
                  <input
                    className="mc-input"
                    type="date"
                    value={pregnancy.edd}
                    onChange={(e) =>
                      setPregnancy((p) => ({ ...p, edd: e.target.value }))
                    }
                  />
                </Field>
                {pregnancy.edd && (
                  <Field label="How was this date determined?">
                    <select
                      className="mc-input"
                      value={pregnancy.edd_source}
                      onChange={(e) =>
                        setPregnancy((p) => ({
                          ...p,
                          edd_source: e.target.value,
                        }))
                      }
                    >
                      <option value="ultrasound">Ultrasound dating</option>
                      <option value="clinical">Clinical assessment</option>
                      <option value="lmp">Last menstrual period</option>
                    </select>
                  </Field>
                )}
                <Field label="Gravida" hint="Pregnancies including this one">
                  <input
                    className="mc-input"
                    type="number"
                    min={0}
                    value={pregnancy.gravida}
                    onChange={(e) =>
                      setPregnancy((p) => ({ ...p, gravida: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Para" hint="Births reaching viable gestation">
                  <input
                    className="mc-input"
                    type="number"
                    min={0}
                    value={pregnancy.para}
                    onChange={(e) =>
                      setPregnancy((p) => ({ ...p, para: e.target.value }))
                    }
                  />
                </Field>
              </div>

              {derivedEdd && (
                <div className="mc-derived">
                  <span>
                    Due{" "}
                    <strong>{new Date(derivedEdd).toLocaleDateString()}</strong>
                  </span>
                  {derivedAge && (
                    <span>
                      Currently <strong>{derivedAge}</strong>
                    </span>
                  )}
                </div>
              )}

              <div style={{ marginTop: 18 }}>
                <div className="mc-label">Obstetric history</div>
                <p className="mc-card-sub" style={{ marginBottom: 12 }}>
                  Leave as Unknown if it wasn&apos;t asked — that is different
                  from No, and recording it as No would hide risk.
                </p>
                <div className="mc-risklist">
                  {RISK_FACTORS.map(({ field, label }) => (
                    <div key={field} className="mc-riskrow">
                      <span className="mc-riskrow-label">{label}</span>
                      <div
                        className="mc-segmented"
                        role="group"
                        aria-label={label}
                      >
                        {(["yes", "no", "unknown"] as RiskAnswer[]).map(
                          (value) => (
                            <button
                              key={value}
                              type="button"
                              className="mc-segment"
                              aria-pressed={risk[field] === value}
                              onClick={() =>
                                setRisk((r) => ({ ...r, [field]: value }))
                              }
                            >
                              {value === "yes"
                                ? "Yes"
                                : value === "no"
                                  ? "No"
                                  : "Unknown"}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <label className="mc-label" htmlFor="preg-notes">
                  Clinical notes
                </label>
                <textarea
                  id="preg-notes"
                  className="mc-input"
                  rows={3}
                  value={pregnancy.notes}
                  onChange={(e) =>
                    setPregnancy((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Anything relevant that doesn't fit the fields above"
                />
              </div>
            </div>
          )}
        </section>

        {recordPregnancy && (
          <section className="mc-card">
            <div className="mc-card-head">
              <div>
                <div className="mc-card-title">Care assignment</div>
                <div className="mc-card-sub">
                  Who is clinically responsible for this pregnancy. Assigned per
                  pregnancy, not per patient — the same woman may be under a
                  different clinician next time.
                </div>
              </div>
            </div>
            <div className="mc-card-body">
              <div style={{ maxWidth: 380 }}>
                <label className="mc-label" htmlFor="assigned-staff">
                  Lead clinician
                </label>
                <select
                  id="assigned-staff"
                  className="mc-input"
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                >
                  <option value="">Not assigned yet</option>
                  {clinicians.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} — {c.role_name}
                    </option>
                  ))}
                </select>
                <span className="mc-hint">
                  Only staff at {org.name} appear here.
                </span>
              </div>

              {!assignedStaff && (
                <p
                  className="mc-alert mc-alert-notice"
                  style={{ marginTop: 16, marginBottom: 0 }}
                >
                  <AlertTriangle size={15} strokeWidth={2} aria-hidden />
                  Without a lead clinician, nobody is accountable for this
                  pregnancy — and once monitoring is live, her alerts would have
                  no one to reach. You can assign someone later, but it is worth
                  doing now.
                </p>
              )}

              {clinicians.length === 0 && (
                <p
                  className="mc-alert mc-alert-notice"
                  style={{ marginTop: 16, marginBottom: 0 }}
                >
                  <AlertTriangle size={15} strokeWidth={2} aria-hidden />
                  No clinical staff have joined yet. Invite doctors from Doctors
                  &amp; Staff, then assign one to this pregnancy.
                </p>
              )}
            </div>
          </section>
        )}

        <section className="mc-card">
          <div className="mc-card-head">
            <div>
              <div className="mc-card-title">Consent</div>
              <div className="mc-card-sub">
                Recorded with your name and the time, and kept permanently.
              </div>
            </div>
          </div>
          <div className="mc-card-body">
            <label className="mc-consent">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
              />
              <span>
                I confirm the patient has consented to MomCare collecting and
                processing her maternal health information, under consent policy{" "}
                <strong>{CONSENT_VERSION}</strong>.
              </span>
            </label>

            <div style={{ maxWidth: 320, marginTop: 14 }}>
              <label className="mc-label" htmlFor="consent-method">
                How was consent obtained?
              </label>
              <select
                id="consent-method"
                className="mc-input"
                value={consentMethod}
                onChange={(e) => setConsentMethod(e.target.value)}
              >
                <option value="in_person">In person, signed</option>
                <option value="verbal">Verbal, witnessed</option>
                <option value="digital">Digital</option>
              </select>
            </div>
          </div>
        </section>

        {error && (
          <p className="mc-alert mc-alert-error">
            <AlertCircle size={15} strokeWidth={2} aria-hidden />
            {error}
          </p>
        )}

        <div className="mc-actions">
          <button
            type="submit"
            className="mc-btn"
            disabled={submitting || !consentGiven}
          >
            {consentGiven ? (
              <UserPlus size={15} strokeWidth={2} aria-hidden />
            ) : (
              <ShieldCheck size={15} strokeWidth={2} aria-hidden />
            )}
            {submitting ? "Enrolling…" : "Enrol patient"}
          </button>
          <Link href="/dashboard/patients" className="mc-btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mc-label">
        {label} {required && <span className="mc-req">*</span>}
      </label>
      {children}
      {hint && <span className="mc-hint">{hint}</span>}
    </div>
  );
}
