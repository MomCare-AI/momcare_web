"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

const BASE = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";

const STEPS = [
  {
    title: "Personal Details",
    icon: `${BASE}/Bust%20in%20silhouette/3D/bust_in_silhouette_3d.png`,
    desc: "Start with the basics",
  },
  {
    title: "Medical Credentials",
    icon: `${BASE}/Graduation%20cap/3D/graduation_cap_3d.png`,
    desc: "Your qualifications & license",
  },
  {
    title: "Hospital / Organization",
    icon: `${BASE}/Hospital/3D/hospital_3d.png`,
    desc: "Where you practice",
  },
  {
    title: "Location",
    icon: `${BASE}/Round%20pushpin/3D/round_pushpin_3d.png`,
    desc: "Your clinic location",
  },
  {
    title: "Availability",
    icon: `${BASE}/Spiral%20calendar/3D/spiral_calendar_3d.png`,
    desc: "Your working schedule",
  },
  {
    title: "Review & Submit",
    icon: `${BASE}/Check%20mark%20button/3D/check_mark_button_3d.png`,
    desc: "Confirm your details",
  },
];

const SPECIALIZATIONS = [
  "OB/GYN",
  "General Practitioner",
  "Midwife",
  "Pediatrician",
  "Internal Medicine",
  "Family Medicine",
  "Other",
];
const HOSPITAL_TYPES = [
  "Public Hospital",
  "Private Hospital",
  "NGO Clinic",
  "Private Clinic",
  "Teaching Hospital",
  "Rural Health Centre",
];
const PROVINCES = [
  "Punjab",
  "Sindh",
  "KPK",
  "Balochistan",
  "Islamabad",
  "AJK",
  "Gilgit-Baltistan",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  licenseNo: string;
  specialization: string;
  experience: string;
  degree: string;
  hospitalName: string;
  hospitalType: string;
  department: string;
  city: string;
  province: string;
  address: string;
  zip: string;
  workDays: string[];
  startTime: string;
  endTime: string;
  agreed: boolean;
}

export default function DoctorOnboarding() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [data, setData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    licenseNo: "",
    specialization: "",
    experience: "",
    degree: "",
    hospitalName: "",
    hospitalType: "",
    department: "",
    city: "",
    province: "",
    address: "",
    zip: "",
    workDays: [],
    startTime: "09:00",
    endTime: "17:00",
    agreed: false,
  });

  const set = (field: keyof FormData, val: string | boolean) =>
    setData((d) => ({ ...d, [field]: val }));

  const toggleDay = (day: string) =>
    setData((d) => ({
      ...d,
      workDays: d.workDays.includes(day)
        ? d.workDays.filter((x) => x !== day)
        : [...d.workDays, day],
    }));

  const goNext = () => {
    setDir("next");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goPrev = () => {
    setDir("prev");
    setStep((s) => Math.max(s - 1, 0));
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="ob-wrap">
      {/* ── Left panel ──────────────────────────────────────── */}
      <aside className="ob-left">
        <Link href="/" className="ob-brand">
          <motion.span
            className="ob-brand-icon"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            ♥
          </motion.span>
          <span className="ob-brand-name">MomCare</span>
        </Link>

        <div className="ob-step-list">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className={`ob-step-item ${i === step ? "obs-active" : ""} ${i < step ? "obs-done" : ""}`}
            >
              <motion.div
                className="obs-dot"
                animate={
                  i < step
                    ? { backgroundColor: "#6ECFBB", scale: [1, 1.2, 1] }
                    : i === step
                      ? { backgroundColor: "rgba(255,255,255,0.9)", scale: 1 }
                      : { backgroundColor: "rgba(255,255,255,0.25)", scale: 1 }
                }
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {i < step ? "✓" : <span>{i + 1}</span>}
              </motion.div>
              {i < STEPS.length - 1 && <div className="obs-line" />}
              <div className="obs-info">
                <div className="obs-title">{s.title}</div>
                <div className="obs-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <blockquote className="ob-quote">
          &ldquo;Every mother deserves a doctor who never misses a
          heartbeat.&rdquo;
        </blockquote>
      </aside>

      {/* ── Right panel ─────────────────────────────────────── */}
      <main className="ob-right">
        {/* Progress bar — Motion-animated fill */}
        <div className="ob-progress-wrap">
          <div className="ob-progress-bar">
            <motion.div
              className="ob-progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>
          <span className="ob-progress-label">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>

        {/* Form card — CSS 3D slide (key forces remount → animation fires fresh) */}
        <div key={step} className={`ob-card ob-anim-${dir}`}>
          <div className="ob-card-head">
            <motion.div
              className="ob-card-icon"
              initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={STEPS[step].icon}
                alt=""
                width={36}
                height={36}
                style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.18,
                duration: 0.42,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              <h1 className="ob-card-title">{STEPS[step].title}</h1>
              <p className="ob-card-sub">{STEPS[step].desc}</p>
            </motion.div>
          </div>

          <div className="ob-card-body">
            {/* Step 1 — Personal */}
            {step === 0 && (
              <div className="ob-fields">
                <div className="ob-row2">
                  <div className="ob-field">
                    <label>First Name</label>
                    <input
                      value={data.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      placeholder="Zara"
                    />
                  </div>
                  <div className="ob-field">
                    <label>Last Name</label>
                    <input
                      value={data.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      placeholder="Ahmed"
                    />
                  </div>
                </div>
                <div className="ob-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="dr.zara@hospital.com"
                  />
                </div>
                <div className="ob-field">
                  <label>Phone Number</label>
                  <input
                    value={data.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+92 300 0000000"
                  />
                </div>
                <div className="ob-row2">
                  <div className="ob-field">
                    <label>Password</label>
                    <input
                      type="password"
                      value={data.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="ob-field">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      value={data.confirmPassword}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Credentials */}
            {step === 1 && (
              <div className="ob-fields">
                <div className="ob-field">
                  <label>PMDC License Number</label>
                  <input
                    value={data.licenseNo}
                    onChange={(e) => set("licenseNo", e.target.value)}
                    placeholder="PMDC-12345"
                  />
                </div>
                <div className="ob-field">
                  <label>Specialization</label>
                  <select
                    value={data.specialization}
                    onChange={(e) => set("specialization", e.target.value)}
                  >
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ob-row2">
                  <div className="ob-field">
                    <label>Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      value={data.experience}
                      onChange={(e) => set("experience", e.target.value)}
                      placeholder="5"
                    />
                  </div>
                  <div className="ob-field">
                    <label>Highest Qualification</label>
                    <input
                      value={data.degree}
                      onChange={(e) => set("degree", e.target.value)}
                      placeholder="MBBS, FCPS..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Hospital */}
            {step === 2 && (
              <div className="ob-fields">
                <div className="ob-field">
                  <label>Hospital / Clinic Name</label>
                  <input
                    value={data.hospitalName}
                    onChange={(e) => set("hospitalName", e.target.value)}
                    placeholder="Shaukat Khanum Memorial Hospital"
                  />
                </div>
                <div className="ob-field">
                  <label>Type of Organization</label>
                  <select
                    value={data.hospitalType}
                    onChange={(e) => set("hospitalType", e.target.value)}
                  >
                    <option value="">Select type</option>
                    {HOSPITAL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ob-field">
                  <label>Department / Unit</label>
                  <input
                    value={data.department}
                    onChange={(e) => set("department", e.target.value)}
                    placeholder="Obstetrics & Gynaecology"
                  />
                </div>
              </div>
            )}

            {/* Step 4 — Location */}
            {step === 3 && (
              <div className="ob-fields">
                <div className="ob-row2">
                  <div className="ob-field">
                    <label>City</label>
                    <input
                      value={data.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="Lahore"
                    />
                  </div>
                  <div className="ob-field">
                    <label>Province</label>
                    <select
                      value={data.province}
                      onChange={(e) => set("province", e.target.value)}
                    >
                      <option value="">Select province</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ob-field">
                  <label>Full Address</label>
                  <input
                    value={data.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Street no., Area, City"
                  />
                </div>
                <div className="ob-field">
                  <label>ZIP / Postal Code</label>
                  <input
                    value={data.zip}
                    onChange={(e) => set("zip", e.target.value)}
                    placeholder="54000"
                  />
                </div>
              </div>
            )}

            {/* Step 5 — Availability */}
            {step === 4 && (
              <div className="ob-fields">
                <div className="ob-field">
                  <label>Working Days</label>
                  <div className="ob-days">
                    {DAYS.map((d) => (
                      <motion.button
                        key={d}
                        type="button"
                        className={`ob-day-btn ${data.workDays.includes(d) ? "ob-day-on" : ""}`}
                        onClick={() => toggleDay(d)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                      >
                        {d}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="ob-row2">
                  <div className="ob-field">
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={data.startTime}
                      onChange={(e) => set("startTime", e.target.value)}
                    />
                  </div>
                  <div className="ob-field">
                    <label>End Time</label>
                    <input
                      type="time"
                      value={data.endTime}
                      onChange={(e) => set("endTime", e.target.value)}
                    />
                  </div>
                </div>
                <div className="ob-note">
                  Patients will see your availability when booking appointments
                  through the MomCare patient app.
                </div>
              </div>
            )}

            {/* Step 6 — Review */}
            {step === 5 && (
              <div className="ob-fields">
                <div className="ob-review">
                  {[
                    {
                      l: "Full Name",
                      v: `Dr. ${data.firstName} ${data.lastName}`.trim() || "—",
                    },
                    { l: "Email", v: data.email || "—" },
                    { l: "Phone", v: data.phone || "—" },
                    { l: "License", v: data.licenseNo || "—" },
                    { l: "Specialization", v: data.specialization || "—" },
                    {
                      l: "Experience",
                      v: data.experience ? `${data.experience} years` : "—",
                    },
                    { l: "Degree", v: data.degree || "—" },
                    { l: "Hospital", v: data.hospitalName || "—" },
                    { l: "Hospital Type", v: data.hospitalType || "—" },
                    { l: "Department", v: data.department || "—" },
                    {
                      l: "Location",
                      v:
                        [data.city, data.province].filter(Boolean).join(", ") ||
                        "—",
                    },
                    { l: "Address", v: data.address || "—" },
                    {
                      l: "Schedule",
                      v: data.workDays.length
                        ? `${data.workDays.join(" · ")}  |  ${data.startTime} – ${data.endTime}`
                        : "—",
                    },
                  ].map((row, i) => (
                    <motion.div
                      key={row.l}
                      className="ob-rev-row"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: i * 0.04,
                        duration: 0.35,
                        ease: "easeOut",
                      }}
                    >
                      <span className="ob-rev-label">{row.l}</span>
                      <span className="ob-rev-val">{row.v}</span>
                    </motion.div>
                  ))}
                </div>
                <label className="ob-agree">
                  <input
                    type="checkbox"
                    checked={data.agreed}
                    onChange={(e) => set("agreed", e.target.checked)}
                  />
                  I confirm all information is accurate and I agree to
                  MomCare&apos;s terms of service.
                </label>
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="ob-card-foot">
            {step > 0 ? (
              <motion.button
                className="ob-btn-back"
                onClick={goPrev}
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.96 }}
              >
                ← Back
              </motion.button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <motion.button
                className="ob-btn-next"
                onClick={goNext}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Continue <span className="ob-btn-arrow">→</span>
              </motion.button>
            ) : (
              <motion.button
                className="ob-btn-submit"
                disabled={!data.agreed}
                whileHover={data.agreed ? { scale: 1.04, y: -2 } : {}}
                whileTap={data.agreed ? { scale: 0.97 } : {}}
              >
                Complete Onboarding ✓
              </motion.button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
