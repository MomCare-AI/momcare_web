"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import HwStep1Personal from "./HwStep1Personal";
import HwOrgStep1Identity from "./HwOrgStep1Identity";
import HwOrgStep2Contact from "./HwOrgStep2Contact";
import HwOrgStep3Location from "./HwOrgStep3Location";
import HwSuccess from "./HwStep3Success";
import type {
  Step1Data,
  OrgStep1Data,
  OrgStep2Data,
  OrgStep3Data,
} from "./hwSchemas";
import { registerHospital, type WizardFormData } from "../api/registerHospital";

type WizardData = Partial<
  Step1Data & OrgStep1Data & OrgStep2Data & OrgStep3Data
>;

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Organization" },
  { id: 3, label: "Contact" },
  { id: 4, label: "Location" },
];

export default function HospitalWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const advance = (stepData: WizardData) => {
    setData((d) => ({ ...d, ...stepData }));
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleFinalSubmit = async (stepData: WizardData) => {
    const merged = { ...data, ...stepData } as WizardFormData;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await registerHospital(merged);
      setData(merged);
      setStep(STEPS.length);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Registration failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDone = step >= STEPS.length;

  return (
    <div className="hw-page">
      {/* ── Top progress fill ── */}
      <div className="hw-progress-track">
        <motion.div
          className="hw-progress-fill"
          animate={{
            width: isDone ? "100%" : `${((step + 1) / STEPS.length) * 100}%`,
          }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* ── Header ── */}
      <header className="hw-header">
        <Link href="/" className="hw-brand">
          <Image
            src="/avatars/logo.png"
            alt="MomCare"
            width={140}
            height={34}
            style={{ objectFit: "contain", height: "34px", width: "auto" }}
            priority
          />
        </Link>

        {!isDone && (
          <div className="hw-stepper">
            {STEPS.map((s, i) => (
              <div key={s.id} className="hw-stepper-item">
                <div
                  className={`hw-step-dot ${i < step ? "hw-step-done" : i === step ? "hw-step-active" : "hw-step-idle"}`}
                >
                  {i < step ? (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path
                        d="M1 5l3.5 3.5L11 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    s.id
                  )}
                </div>
                <span
                  className={`hw-step-label ${i === step ? "hw-step-label-active" : ""}`}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`hw-step-line ${i < step ? "hw-step-line-done" : ""}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="hw-header-end">
          {!isDone && (
            <span className="hw-step-counter">
              Step {step + 1} of {STEPS.length}
            </span>
          )}
        </div>
      </header>

      {/* ── Main form area ── */}
      <main className="hw-main">
        {/* Scrollable fields area */}
        <div className="hw-scroll-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="hw-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {step === 0 && (
                <HwStep1Personal
                  defaultValues={data}
                  onSubmit={(d) => advance(d)}
                />
              )}
              {step === 1 && (
                <HwOrgStep1Identity
                  defaultValues={data}
                  initialLogo={logoFile}
                  onSubmit={(d, logo) => {
                    setLogoFile(logo);
                    advance(d);
                  }}
                  onBack={back}
                />
              )}
              {step === 2 && (
                <HwOrgStep2Contact
                  defaultValues={data}
                  onSubmit={(d) => advance(d)}
                  onBack={back}
                />
              )}
              {step === 3 && (
                <HwOrgStep3Location
                  defaultValues={data}
                  onSubmit={handleFinalSubmit}
                  onBack={back}
                />
              )}
              {isDone && <HwSuccess />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fixed bottom action bar — outside AnimatePresence so it never scrolls */}
        {!isDone && (
          <div className="hw-actions-wrap">
            {submitError && (
              <div className="hw-error-banner" role="alert">
                {submitError}
              </div>
            )}
            <div className="hw-actions">
              {step > 0 && (
                <button
                  type="button"
                  onClick={back}
                  disabled={isSubmitting}
                  className="hw-btn-ghost"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13 8H3M7 12l-4-4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Back
                </button>
              )}
              <button
                type="submit"
                form="hw-step-form"
                disabled={isSubmitting}
                className="hw-btn-primary"
              >
                {isSubmitting
                  ? "Submitting…"
                  : step === STEPS.length - 1
                    ? "Submit application"
                    : "Continue"}
                {!isSubmitting && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      {!isDone && (
        <footer className="hw-footer">
          Already registered?{" "}
          <Link href="/login" className="hw-footer-link">
            Sign in to your account
          </Link>
        </footer>
      )}
    </div>
  );
}
