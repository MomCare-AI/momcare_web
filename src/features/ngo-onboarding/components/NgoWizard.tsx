"use client";

import { useState } from "react";
import Link from "next/link";

import { RegistrationShell } from "@/shared/registration/RegistrationShell";
import { submitNgoApplication } from "../api/registerNgo";
import type {
  LegalData,
  NgoRegistrationData,
  OrgInfoData,
  RepresentativeData,
} from "../schemas";
import type { NgoDocumentInput } from "../types";
import NgoStep1Organization from "./NgoStep1Organization";
import NgoStep2Legal from "./NgoStep2Legal";
import NgoStep3Representative from "./NgoStep3Representative";
import NgoStep4Review from "./NgoStep4Review";
import NgoSuccess from "./NgoSuccess";

type WizardData = Partial<OrgInfoData & LegalData & RepresentativeData>;

const STEPS = [
  { id: 1, label: "Organization" },
  { id: 2, label: "Registration" },
  { id: 3, label: "Representative" },
  { id: 4, label: "Review" },
];

export default function NgoWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({});
  const [documents, setDocuments] = useState<NgoDocumentInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const advance = (stepData: WizardData) => {
    setData((d) => ({ ...d, ...stepData }));
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitNgoApplication(data as NgoRegistrationData, documents);
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
      finalActionLabel="Submit registration"
      className="hw-theme-ngo"
      footer={
        <footer className="hw-footer">
          Already verified?{" "}
          <Link href="/login" className="hw-footer-link">
            Sign in to your NGO account
          </Link>
        </footer>
      }
    >
      {step === 0 && (
        <NgoStep1Organization defaultValues={data} onSubmit={advance} />
      )}
      {step === 1 && <NgoStep2Legal defaultValues={data} onSubmit={advance} />}
      {step === 2 && (
        <NgoStep3Representative
          defaultValues={data}
          documents={documents}
          onDocumentsChange={setDocuments}
          onSubmit={advance}
        />
      )}
      {step === 3 && (
        <NgoStep4Review
          data={data}
          documents={documents}
          onEdit={setStep}
          onSubmit={submit}
        />
      )}
      {step >= STEPS.length && <NgoSuccess />}
    </RegistrationShell>
  );
}
