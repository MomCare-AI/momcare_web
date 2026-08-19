"use client";

import Link from "next/link";
import { motion } from "motion/react";

const STEPS = [
  { label: "Account", desc: "Email & password" },
  { label: "Verification", desc: "CNIC & PMDC" },
  { label: "Profile", desc: "Specialty & hospital" },
];

export default function OnboardingLeft({ step }: { step: number }) {
  return (
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

      <div className="ob-avatar-section">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Woman%20health%20worker/3D/woman_health_worker_3d.png"
          alt="Doctor avatar"
          className="ob-avatar-img"
          loading="lazy"
        />
        <p className="ob-avatar-welcome">
          {step === 3 ? "You're all set!" : "Welcome, Doctor!"}
        </p>
        <p className="ob-avatar-sub">
          {step === 3
            ? "Your application is under review"
            : "Join Pakistan's leading maternal health platform"}
        </p>
      </div>

      {step < 3 && (
        <div className="ob-trust-row">
          <div className="ob-trust-badge">
            <span>🛡️</span>
            <span>PMDC Verified</span>
          </div>
          <div className="ob-trust-badge">
            <span>🔒</span>
            <span>Secure Data</span>
          </div>
        </div>
      )}

      {step < 3 && (
        <div className="ob-step-list">
          {STEPS.map((s, i) => (
            <div
              key={s.label}
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
                <div className="obs-title">{s.label}</div>
                <div className="obs-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <blockquote className="ob-quote">
        &ldquo;Every mother deserves a doctor who never misses a
        heartbeat.&rdquo;
      </blockquote>
    </aside>
  );
}
