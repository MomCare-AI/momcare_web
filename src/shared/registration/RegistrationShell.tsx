"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

import {
  RegistrationStepper,
  type RegistrationStep,
} from "./RegistrationStepper";

/** Every step's <form> uses this id so the shell's bar can submit it. */
export const REGISTRATION_FORM_ID = "hw-step-form";

interface Props {
  steps: RegistrationStep[];
  /** 0-based current step; `steps.length` or more means the flow is finished. */
  step: number;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  /** Label of the button on the last step. */
  finalActionLabel?: string;
  footer?: React.ReactNode;
  /** The current step's form, or the success screen once finished. */
  children: React.ReactNode;
}

/**
 * Shared chrome for MomCare's multi-step registration flows (hospital, NGO):
 * progress bar, header with stepper, animated content area, fixed Back /
 * Continue bar, and footer. Steps own their own forms and validation.
 */
export function RegistrationShell({
  steps,
  step,
  onBack,
  isSubmitting,
  submitError,
  finalActionLabel = "Submit application",
  footer,
  children,
}: Props) {
  const isDone = step >= steps.length;

  return (
    <div className="hw-page">
      {/* ── Top progress fill ── */}
      <div className="hw-progress-track">
        <motion.div
          className="hw-progress-fill"
          animate={{
            width: isDone ? "100%" : `${((step + 1) / steps.length) * 100}%`,
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

        {!isDone && <RegistrationStepper steps={steps} step={step} />}

        <div className="hw-header-end">
          {!isDone && (
            <span className="hw-step-counter">
              Step {step + 1} of {steps.length}
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
              {children}
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
                  onClick={onBack}
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
                form={REGISTRATION_FORM_ID}
                disabled={isSubmitting}
                className="hw-btn-primary"
              >
                {isSubmitting
                  ? "Submitting…"
                  : step === steps.length - 1
                    ? finalActionLabel
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
      {!isDone && footer}
    </div>
  );
}
