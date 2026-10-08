"use client";

import {
  checkAddressLine,
  checkCnic,
  checkDateOfBirth,
  checkEmail,
  checkPersonName,
  checkPhone,
  checkPlace,
  checkPostalCode,
  checkWholeNumber,
  keepCnic,
  keepName,
  keepPhone,
  keepPlace,
  keepText,
  type Rule,
} from "@/shared/lib/validation";
import { cloneElement, isValidElement, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  HeartPulse,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";

import { SessionExpiredError } from "@/core/api/authFetch";
import type { EnrolmentInput } from "@/features/patients/api";
import {
  useClinicians,
  useEnrolPatient,
} from "@/features/patients/hooks/usePatients";
import {
  BLOOD_GROUPS,
  RISK_FACTORS,
  type RiskAnswer,
  type RiskFactorField,
} from "@/features/patients/types";
import { usePortal } from "../../portal";
import { usePageTitle } from "@/hooks/usePageTitle";

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Unknown" },
];

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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type FormState = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  cnic: string;
  blood_group: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  emergency_contact_email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type PregnancyState = {
  lmp: string;
  edd: string;
  edd_source: string;
  gravida: string;
  para: string;
  notes: string;
};

/** What may be typed into each field. Anything else is dropped as it is typed
 *  or pasted, so a digit can never end up in a name. */
const FILTERS: Partial<Record<keyof FormState, (v: string) => string>> = {
  first_name: keepName,
  last_name: keepName,
  emergency_contact_name: keepName,
  emergency_contact_relation: keepName,
  phone: keepPhone,
  emergency_contact_phone: keepPhone,
  cnic: keepCnic,
  city: keepPlace,
  state: keepPlace,
  country: keepPlace,
  address_line1: (v) => keepText(v, 200),
  address_line2: (v) => keepText(v, 200),
  postal_code: (v) => v.replace(/[^A-Za-z0-9 -]/g, "").slice(0, 10),
  emergency_contact_email: (v) => v.replace(/\s/g, "").slice(0, 254),
};

type FieldErrors = Partial<
  Record<keyof FormState | "gravida" | "para" | "lmp", string>
>;

/** The first problem with each field, using the shared rules. */
function validateForm(
  form: FormState,
  pregnancy: PregnancyState,
  recordPregnancy: boolean
): FieldErrors {
  const errors: FieldErrors = {};
  const add = (field: keyof FieldErrors, rule: Rule) => {
    if (rule) errors[field] = rule;
  };
  add("first_name", checkPersonName(form.first_name, "First name"));
  add(
    "last_name",
    checkPersonName(form.last_name, "Last name", { required: false })
  );
  add("date_of_birth", checkDateOfBirth(form.date_of_birth));
  add("phone", checkPhone(form.phone));
  add("cnic", checkCnic(form.cnic));
  add(
    "emergency_contact_name",
    checkPersonName(form.emergency_contact_name, "Emergency contact name", {
      required: false,
    })
  );
  add(
    "emergency_contact_phone",
    checkPhone(form.emergency_contact_phone, "Emergency contact phone")
  );
  add(
    "emergency_contact_relation",
    checkPersonName(form.emergency_contact_relation, "Relationship", {
      required: false,
    })
  );
  add(
    "emergency_contact_email",
    checkEmail(form.emergency_contact_email, "Email", { required: false })
  );
  add("address_line1", checkAddressLine(form.address_line1, "Address line 1"));
  add("address_line2", checkAddressLine(form.address_line2, "Address line 2"));
  add("city", checkPlace(form.city, "City"));
  add("state", checkPlace(form.state, "State / province"));
  add("postal_code", checkPostalCode(form.postal_code));
  add("country", checkPlace(form.country, "Country"));

  if (recordPregnancy) {
    add("gravida", checkWholeNumber(pregnancy.gravida, "Gravida", 1, 20));
    add("para", checkWholeNumber(pregnancy.para, "Para", 0, 20));
    if (
      !errors.gravida &&
      !errors.para &&
      pregnancy.gravida &&
      pregnancy.para &&
      Number(pregnancy.para) > Number(pregnancy.gravida)
    ) {
      errors.para = "Para cannot be higher than gravida.";
    }
    if (pregnancy.lmp) {
      const days = (Date.now() - new Date(pregnancy.lmp).getTime()) / 86400000;
      if (Number.isNaN(days)) errors.lmp = "Enter a valid date.";
      else if (days < 0)
        errors.lmp = "The last period cannot be in the future.";
      else if (days > 310) {
        errors.lmp = "That is over 44 weeks ago. Check the date.";
      }
    }
  }
  return errors;
}

const STEPS = [
  { label: "Identity & Contact", sub: "Who is the patient", Icon: User },
  {
    label: "Pregnancy & Care Team",
    sub: "Dates, history & who's responsible",
    Icon: HeartPulse,
  },
  { label: "Consent", sub: "Before monitoring begins", Icon: ShieldCheck },
] as const;

/**
 * Three steps — Identity & Contact, Pregnancy & Care Team, Consent — with a
 * live preview beside the form, restyled from the reference platform's own
 * enrollment wizard. Only fields `PatientCreateSerializer` actually accepts
 * appear here: no document-scan autofill (no OCR endpoint exists), no
 * username/password (enrollment never creates an app account), no RPM/CCM
 * program tags (doesn't exist on `Patient`) — building any of those would
 * mean a control that looks functional but silently does nothing, which is
 * its own kind of fabrication. The six address fields are real and required
 * by the backend, stored on the Patient row itself.
 */
export default function EnrolPatientPage() {
  usePageTitle("Enrol Patient");
  const router = useRouter();
  const { org } = usePortal();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    cnic: "",
    blood_group: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    emergency_contact_email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });
  const [recordPregnancy, setRecordPregnancy] = useState(true);
  const [pregnancy, setPregnancy] = useState<PregnancyState>({
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
  const [provider, setProvider] = useState("");
  const [nurse, setNurse] = useState("");
  const [careManager, setCareManager] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  // Convenience only — the API scopes this list to the hospital and
  // re-validates the choice on save, so a tampered value cannot get through.
  const { data: clinicians = [] } = useClinicians();
  const providers = useMemo(
    () => clinicians.filter((c) => c.role_code === "provider"),
    [clinicians]
  );
  const nurses = useMemo(
    () => clinicians.filter((c) => c.role_code === "nurse"),
    [clinicians]
  );
  const careManagers = useMemo(
    () => clinicians.filter((c) => c.role_code === "care_manager"),
    [clinicians]
  );
  const enrol = useEnrolPatient();

  // Pending state comes from the mutation rather than a parallel boolean, so
  // the button can never disagree with whether a request is actually in flight.
  const submitting = enrol.isPending;
  const [error, setError] = useState<string | null>(null);

  // Shown live so the person entering the LMP can sanity-check it against what
  // the mother says, instead of discovering a typo weeks later.
  const derivedEdd = useMemo(
    () => pregnancy.edd || eddFromLmp(pregnancy.lmp),
    [pregnancy.lmp, pregnancy.edd]
  );
  const derivedAge = derivedEdd ? gestationalAge(derivedEdd) : null;

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Check one field as soon as the user leaves it, so a mistake is flagged
  // right there instead of at the end of the form.
  const blurField = (field: keyof FieldErrors) => {
    const message = validateForm(form, pregnancy, recordPregnancy)[field];
    setFieldErrors((e) => ({ ...e, [field]: message }));
  };

  const set = (field: keyof FormState, raw: string) => {
    const value = FILTERS[field]?.(raw) ?? raw;
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const problems = validateForm(form, pregnancy, recordPregnancy);
    if (Object.values(problems).some(Boolean)) {
      setFieldErrors(problems);
      setError("Please correct the highlighted fields.");
      const onFirstStep = Object.keys(problems).some(
        (k) => k !== "gravida" && k !== "para" && k !== "lmp"
      );
      setStep(onFirstStep ? 0 : 1);
      return;
    }

    if (recordPregnancy && !pregnancy.lmp && !pregnancy.edd) {
      setError(
        "Enter either the last menstrual period or an estimated delivery date — " +
          "without one, gestational age cannot be calculated."
      );
      setStep(1);
      return;
    }

    const payload: EnrolmentInput = {
      ...form,
      date_of_birth: form.date_of_birth || null,
      consent_date: consentGiven ? todayIso() : null,
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
        provider: provider || null,
        nurse: nurse || null,
        care_manager: careManager || null,
        notes: pregnancy.notes,
        ...risk,
      };
    }

    try {
      // The mutation invalidates the patient list and the dashboard count, so
      // both are correct by the time the profile renders.
      const patient = await enrol.mutateAsync(payload);
      router.push(`/dashboard/patients/${patient.id}?enrolled=1`);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        router.replace("/login?expired=1");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Could not enrol this patient."
      );
    }
  };

  const providerName = providers.find((p) => p.id === provider)?.full_name;
  const nurseName = nurses.find((n) => n.id === nurse)?.full_name;
  const careManagerName = careManagers.find(
    (c) => c.id === careManager
  )?.full_name;

  return (
    <>
      <div
        className="mc-head"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 14,
        }}
      >
        <button
          type="button"
          className="mc-iconbtn"
          style={{ borderRadius: "50%" }}
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ArrowLeft size={16} strokeWidth={2.2} aria-hidden />
        </button>
        <h1 className="mc-h1" style={{ color: "var(--c-teal)" }}>
          Enrol a patient
        </h1>
      </div>

      <div
        className="mc-wizard-steps"
        role="tablist"
        aria-label="Enrollment steps"
      >
        {STEPS.map(({ label, sub, Icon }, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={active}
              className={
                "mc-wizard-step" +
                (active ? " mc-wizard-step-active" : "") +
                (done ? " mc-wizard-step-done" : "")
              }
              onClick={() => setStep(i)}
            >
              <span className="mc-wizard-step-icon">
                {done ? (
                  <Check size={14} strokeWidth={2.4} aria-hidden />
                ) : (
                  <Icon size={15} strokeWidth={1.9} aria-hidden />
                )}
              </span>
              <span>
                <div className="mc-wizard-step-label">{label}</div>
                <div className="mc-wizard-step-sub">{sub}</div>
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={submit}>
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div
            data-testid="enroll-form-panel"
            style={{ flex: "2 1 480px", minWidth: 0 }}
          >
            {step === 0 && (
              <section className="mc-card">
                <div className="mc-card-head">
                  <div>
                    <div className="mc-card-title">Identity & Contact</div>
                    <div className="mc-card-sub">Who is the patient</div>
                  </div>
                </div>
                <div className="mc-card-body">
                  <div className="mc-formgrid">
                    <Field
                      label="First name"
                      required
                      error={fieldErrors.first_name}
                      onBlur={() => blurField("first_name")}
                    >
                      <input
                        className="mc-input"
                        value={form.first_name}
                        onChange={(e) => set("first_name", e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Last name"
                      error={fieldErrors.last_name}
                      onBlur={() => blurField("last_name")}
                    >
                      <input
                        className="mc-input"
                        value={form.last_name}
                        onChange={(e) => set("last_name", e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Date of birth"
                      error={fieldErrors.date_of_birth}
                      onBlur={() => blurField("date_of_birth")}
                    >
                      <input
                        className="mc-input"
                        type="date"
                        value={form.date_of_birth}
                        onChange={(e) => set("date_of_birth", e.target.value)}
                      />
                    </Field>
                    <Field label="Gender">
                      <select
                        className="mc-input"
                        value={form.gender}
                        onChange={(e) => set("gender", e.target.value)}
                      >
                        <option value="">Not recorded</option>
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="Phone"
                      hint="Used to find her record later"
                      error={fieldErrors.phone}
                      onBlur={() => blurField("phone")}
                    >
                      <input
                        className="mc-input"
                        value={form.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="03001234567"
                      />
                    </Field>
                    <Field
                      label="CNIC"
                      hint="If she has one"
                      error={fieldErrors.cnic}
                      onBlur={() => blurField("cnic")}
                    >
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
                    <Field
                      label="Emergency contact"
                      error={fieldErrors.emergency_contact_name}
                      onBlur={() => blurField("emergency_contact_name")}
                    >
                      <input
                        className="mc-input"
                        value={form.emergency_contact_name}
                        onChange={(e) =>
                          set("emergency_contact_name", e.target.value)
                        }
                        placeholder="Name"
                      />
                    </Field>
                    <Field
                      label="Their phone"
                      error={fieldErrors.emergency_contact_phone}
                      onBlur={() => blurField("emergency_contact_phone")}
                    >
                      <input
                        className="mc-input"
                        value={form.emergency_contact_phone}
                        onChange={(e) =>
                          set("emergency_contact_phone", e.target.value)
                        }
                      />
                    </Field>
                    <Field
                      label="Relationship"
                      error={fieldErrors.emergency_contact_relation}
                      onBlur={() => blurField("emergency_contact_relation")}
                    >
                      <input
                        className="mc-input"
                        value={form.emergency_contact_relation}
                        onChange={(e) =>
                          set("emergency_contact_relation", e.target.value)
                        }
                        placeholder="Husband, mother, sister…"
                      />
                    </Field>
                    <Field
                      label="Their email"
                      hint="Optional"
                      error={fieldErrors.emergency_contact_email}
                      onBlur={() => blurField("emergency_contact_email")}
                    >
                      <input
                        className="mc-input"
                        type="email"
                        value={form.emergency_contact_email}
                        onChange={(e) =>
                          set("emergency_contact_email", e.target.value)
                        }
                      />
                    </Field>
                  </div>

                  <div
                    className="mc-card-title"
                    style={{ fontSize: 14, margin: "20px 0 10px" }}
                  >
                    Address
                  </div>
                  <div className="mc-formgrid" style={{ marginBottom: 0 }}>
                    <Field
                      label="Address line 1"
                      required
                      error={fieldErrors.address_line1}
                      onBlur={() => blurField("address_line1")}
                    >
                      <input
                        className="mc-input"
                        value={form.address_line1}
                        onChange={(e) => set("address_line1", e.target.value)}
                        placeholder="House 12, Street 4"
                      />
                    </Field>
                    <Field
                      label="Address line 2"
                      required
                      error={fieldErrors.address_line2}
                      onBlur={() => blurField("address_line2")}
                    >
                      <input
                        className="mc-input"
                        value={form.address_line2}
                        onChange={(e) => set("address_line2", e.target.value)}
                        placeholder="Area, e.g. F-7"
                      />
                    </Field>
                    <Field
                      label="City"
                      required
                      error={fieldErrors.city}
                      onBlur={() => blurField("city")}
                    >
                      <input
                        className="mc-input"
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                      />
                    </Field>
                    <Field
                      label="State / province"
                      required
                      error={fieldErrors.state}
                      onBlur={() => blurField("state")}
                    >
                      <input
                        className="mc-input"
                        value={form.state}
                        onChange={(e) => set("state", e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Postal code"
                      required
                      error={fieldErrors.postal_code}
                      onBlur={() => blurField("postal_code")}
                    >
                      <input
                        className="mc-input"
                        value={form.postal_code}
                        onChange={(e) => set("postal_code", e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Country"
                      required
                      error={fieldErrors.country}
                      onBlur={() => blurField("country")}
                    >
                      <input
                        className="mc-input"
                        value={form.country}
                        onChange={(e) => set("country", e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </section>
            )}

            {step === 1 && (
              <>
                <section className="mc-card">
                  <div className="mc-card-head">
                    <div>
                      <div className="mc-card-title">Current pregnancy</div>
                      <div className="mc-card-sub">
                        Gestational age drives everything else — without a date,
                        no reading can be interpreted.
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
                              setPregnancy((p) => ({
                                ...p,
                                lmp: e.target.value,
                              }))
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
                              setPregnancy((p) => ({
                                ...p,
                                edd: e.target.value,
                              }))
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
                              <option value="ultrasound">
                                Ultrasound dating
                              </option>
                              <option value="clinical">
                                Clinical assessment
                              </option>
                              <option value="lmp">Last menstrual period</option>
                            </select>
                          </Field>
                        )}
                        <Field
                          label="Gravida"
                          hint="Pregnancies including this one"
                          error={fieldErrors.gravida}
                          onBlur={() => blurField("gravida")}
                        >
                          <input
                            className="mc-input"
                            inputMode="numeric"
                            maxLength={2}
                            value={pregnancy.gravida}
                            onChange={(e) =>
                              setPregnancy((p) => ({
                                ...p,
                                gravida: e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 2),
                              }))
                            }
                          />
                        </Field>
                        <Field
                          label="Para"
                          hint="Births reaching viable gestation"
                          error={fieldErrors.para}
                          onBlur={() => blurField("para")}
                        >
                          <input
                            className="mc-input"
                            inputMode="numeric"
                            maxLength={2}
                            value={pregnancy.para}
                            onChange={(e) =>
                              setPregnancy((p) => ({
                                ...p,
                                para: e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 2),
                              }))
                            }
                          />
                        </Field>
                      </div>

                      {derivedEdd && (
                        <div className="mc-derived">
                          <span>
                            Due{" "}
                            <strong>
                              {new Date(derivedEdd).toLocaleDateString()}
                            </strong>
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
                          Leave as Unknown if it wasn&apos;t asked — that is
                          different from No, and recording it as No would hide
                          risk.
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
                                        setRisk((r) => ({
                                          ...r,
                                          [field]: value,
                                        }))
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
                          Notes
                        </label>
                        <textarea
                          id="preg-notes"
                          className="mc-input"
                          rows={3}
                          value={pregnancy.notes}
                          onChange={(e) =>
                            setPregnancy((p) => ({
                              ...p,
                              notes: e.target.value,
                            }))
                          }
                          placeholder="Anything relevant that doesn't fit the fields above"
                        />
                      </div>
                    </div>
                  )}
                </section>

                {recordPregnancy && (
                  <section className="mc-card" style={{ marginTop: 18 }}>
                    <div className="mc-card-head">
                      <div>
                        <div className="mc-card-title">Care team</div>
                        <div className="mc-card-sub">
                          Assigned per pregnancy, not per patient — the same
                          woman may be under a different team next time.
                        </div>
                      </div>
                    </div>
                    <div className="mc-card-body">
                      <div className="mc-formgrid">
                        <div>
                          <label className="mc-label" htmlFor="enrol-provider">
                            Provider
                          </label>
                          <select
                            id="enrol-provider"
                            className="mc-input"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                          >
                            <option value="">Not assigned yet</option>
                            {providers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mc-label" htmlFor="enrol-nurse">
                            Nurse
                          </label>
                          <select
                            id="enrol-nurse"
                            className="mc-input"
                            value={nurse}
                            onChange={(e) => setNurse(e.target.value)}
                          >
                            <option value="">Not assigned yet</option>
                            {nurses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            className="mc-label"
                            htmlFor="enrol-care-manager"
                          >
                            Care manager
                          </label>
                          <select
                            id="enrol-care-manager"
                            className="mc-input"
                            value={careManager}
                            onChange={(e) => setCareManager(e.target.value)}
                          >
                            <option value="">Not assigned yet</option>
                            {careManagers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <span className="mc-hint">
                        Only staff at {org.name} appear here.
                      </span>

                      {!provider && (
                        <p
                          className="mc-alert mc-alert-notice"
                          style={{ marginTop: 16, marginBottom: 0 }}
                        >
                          <AlertTriangle
                            size={15}
                            strokeWidth={2}
                            aria-hidden
                          />
                          Without a provider, nobody is the accountable lead for
                          this pregnancy — and once monitoring is live, her
                          alerts would have no one to reach first. You can
                          assign one later, but it is worth doing now.
                        </p>
                      )}

                      {clinicians.length === 0 && (
                        <p
                          className="mc-alert mc-alert-notice"
                          style={{ marginTop: 16, marginBottom: 0 }}
                        >
                          <AlertTriangle
                            size={15}
                            strokeWidth={2}
                            aria-hidden
                          />
                          No clinical staff have joined yet. Add doctors from
                          System Governance, then assign one to this pregnancy.
                        </p>
                      )}
                    </div>
                  </section>
                )}
              </>
            )}

            {step === 2 && (
              <section className="mc-card">
                <div className="mc-card-head">
                  <div>
                    <div className="mc-card-title">Consent</div>
                    <div className="mc-card-sub">
                      Recorded as a date, kept permanently. Not required to
                      enrol — but worth confirming before monitoring begins.
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
                      The patient has consented to MomCare collecting and
                      processing her maternal health information, as of today.
                    </span>
                  </label>
                </div>
              </section>
            )}

            {error && (
              <p className="mc-alert mc-alert-error" style={{ marginTop: 18 }}>
                <AlertCircle size={15} strokeWidth={2} aria-hidden />
                {error}
              </p>
            )}

            <div className="mc-actions" style={{ marginTop: 18 }}>
              {step > 0 && (
                <button
                  type="button"
                  className="mc-btn-ghost"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button
                  type="button"
                  className="mc-btn"
                  onClick={() => setStep((s) => s + 1)}
                >
                  Continue
                </button>
              )}
              {step === STEPS.length - 1 && (
                <button type="submit" className="mc-btn" disabled={submitting}>
                  <UserPlus size={15} strokeWidth={2} aria-hidden />
                  {submitting ? "Enrolling…" : "Enrol patient"}
                </button>
              )}
              <Link href="/dashboard/patients" className="mc-btn-ghost">
                Cancel
              </Link>
            </div>
          </div>

          <div style={{ flex: "1 1 300px", minWidth: 280 }}>
            <LivePreview
              form={form}
              recordPregnancy={recordPregnancy}
              pregnancy={pregnancy}
              derivedEdd={derivedEdd}
              derivedAge={derivedAge}
              risk={risk}
              providerName={providerName}
              nurseName={nurseName}
              careManagerName={careManagerName}
              consentGiven={consentGiven}
              orgName={org.name}
            />
          </div>
        </div>
      </form>
    </>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  onBlur,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  /** The message for this field, shown under it in red. */
  error?: string;
  /** Runs when focus leaves the field. */
  onBlur?: () => void;
  children: React.ReactNode;
}) {
  // Tie the label to its control so a screen reader announces it and a click
  // on the label focuses the field.
  const generated = useId();
  const control = isValidElement<{ id?: string; "aria-describedby"?: string }>(
    children
  )
    ? children
    : null;
  const id = control?.props.id ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div onBlur={onBlur}>
      <label className="mc-label" htmlFor={id}>
        {label} {required && <span className="mc-req">*</span>}
      </label>
      {control
        ? cloneElement(control, {
            id,
            "aria-describedby":
              errorId ?? control.props["aria-describedby"] ?? hintId,
            ...(error ? { "aria-invalid": true } : {}),
          } as Record<string, unknown>)
        : children}
      {error ? (
        <span className="mc-field-error" id={errorId} role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span className="mc-hint" id={hintId}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

function PreviewValue({ value }: { value?: string | null }) {
  return value ? (
    <div className="mc-preview-field-value">{value}</div>
  ) : (
    <div className="mc-preview-field-value mc-preview-field-empty">—</div>
  );
}

function PreviewField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <div className="mc-preview-field-label">{label}</div>
      <PreviewValue value={value} />
    </div>
  );
}

/**
 * Mirrors exactly what's typed, nothing more — every value here is read
 * straight from this page's own form state, never a placeholder standing
 * in for a field the backend doesn't have.
 */
function LivePreview({
  form,
  recordPregnancy,
  pregnancy,
  derivedEdd,
  derivedAge,
  risk,
  providerName,
  nurseName,
  careManagerName,
  consentGiven,
  orgName,
}: {
  form: FormState;
  recordPregnancy: boolean;
  pregnancy: PregnancyState;
  derivedEdd: string | null;
  derivedAge: string | null;
  risk: Record<RiskFactorField, RiskAnswer>;
  providerName?: string;
  nurseName?: string;
  careManagerName?: string;
  consentGiven: boolean;
  orgName: string;
}) {
  const fullName = [form.first_name, form.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const initials =
    [form.first_name[0], form.last_name[0]].filter(Boolean).join("") || "?";
  const presentFactors = RISK_FACTORS.filter(
    ({ field }) => risk[field] === "yes"
  );

  return (
    <div className="mc-preview">
      <div className="mc-preview-flag">
        <span className="mc-preview-flag-dot" aria-hidden />
        LIVE PREVIEW
      </div>
      <div className="mc-preview-card">
        <div className="mc-preview-head">
          <span className="mc-preview-avatar" aria-hidden>
            {initials.toUpperCase()}
          </span>
          <span>
            <div className="mc-preview-name">{fullName || "New Patient"}</div>
            {form.gender && <div className="mc-preview-sub">{form.gender}</div>}
          </span>
        </div>

        <div className="mc-preview-body">
          <div className="mc-preview-section-title">Identity & Contact</div>
          <div className="mc-preview-grid">
            <PreviewField label="First name" value={form.first_name} />
            <PreviewField label="Last name" value={form.last_name} />
            <PreviewField label="Date of birth" value={form.date_of_birth} />
            <PreviewField label="Phone" value={form.phone} />
            <PreviewField label="CNIC" value={form.cnic} />
            <PreviewField label="Blood group" value={form.blood_group} />
          </div>

          <div className="mc-preview-section-title">Emergency contact</div>
          <div className="mc-preview-grid">
            <PreviewField label="Name" value={form.emergency_contact_name} />
            <PreviewField
              label="Relationship"
              value={form.emergency_contact_relation}
            />
            <PreviewField label="Phone" value={form.emergency_contact_phone} />
            <PreviewField label="Email" value={form.emergency_contact_email} />
          </div>

          <div className="mc-preview-section-title">Address</div>
          <div className="mc-preview-grid">
            <PreviewField label="Line 1" value={form.address_line1} />
            <PreviewField label="Line 2" value={form.address_line2} />
            <PreviewField label="City" value={form.city} />
            <PreviewField label="State" value={form.state} />
            <PreviewField label="Postal code" value={form.postal_code} />
            <PreviewField label="Country" value={form.country} />
          </div>

          <div className="mc-preview-section-title">Pregnancy</div>
          {recordPregnancy ? (
            <>
              <div className="mc-preview-grid">
                <PreviewField label="LMP" value={pregnancy.lmp} />
                <PreviewField
                  label="EDD"
                  value={
                    derivedEdd
                      ? new Date(derivedEdd).toLocaleDateString()
                      : null
                  }
                />
                <PreviewField label="Gravida" value={pregnancy.gravida} />
                <PreviewField label="Para" value={pregnancy.para} />
              </div>
              {derivedAge && (
                <p className="mc-hint" style={{ marginTop: 8 }}>
                  Currently {derivedAge}
                </p>
              )}
              {presentFactors.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="mc-preview-field-label">
                    Risk factors present
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    {presentFactors.map(({ field, label }) => (
                      <span key={field} className="mc-badge mc-badge-high">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="mc-hint">Not being recorded at enrollment.</p>
          )}

          <div className="mc-preview-section-title">Care team</div>
          <div className="mc-preview-grid">
            <PreviewField label="Provider" value={providerName} />
            <PreviewField label="Nurse" value={nurseName} />
            <PreviewField label="Care manager" value={careManagerName} />
            <PreviewField label="Location" value={orgName} />
          </div>

          <div className="mc-preview-section-title">Consent</div>
          <PreviewValue
            value={consentGiven ? "Given today" : "Not yet recorded"}
          />
        </div>
      </div>
    </div>
  );
}
