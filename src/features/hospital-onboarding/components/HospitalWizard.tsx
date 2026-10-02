"use client";

import { useState } from "react";
import Link from "next/link";
import { RegistrationShell } from "@/shared/registration/RegistrationShell";
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

  return (
    <RegistrationShell
      steps={STEPS}
      step={step}
      onBack={back}
      isSubmitting={isSubmitting}
      submitError={submitError}
      finalActionLabel="Submit application"
      footer={
        <footer className="hw-footer">
          Already registered?{" "}
          <Link href="/login" className="hw-footer-link">
            Sign in to your account
          </Link>
        </footer>
      }
    >
      {step === 0 && (
        <HwStep1Personal defaultValues={data} onSubmit={(d) => advance(d)} />
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
      {step >= STEPS.length && <HwSuccess />}
    </RegistrationShell>
  );
}
