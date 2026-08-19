"use client";

import { useState } from "react";
import { motion } from "motion/react";
import OnboardingLeft from "./OnboardingLeft";
import Step1Auth from "./Step1Auth";
import Step2Verification from "./Step2Verification";
import Step3Profile from "./Step3Profile";
import Step4Pending from "./Step4Pending";
import type { Step1Data, Step2Data, Step3Data } from "./schemas";

type WizardData = Partial<
  Step1Data &
    Step2Data &
    Step3Data & {
      cnicDoc: File | null;
      pmdcDoc: File | null;
      extraDoc: File | null;
    }
>;

type Dir = "next" | "prev";

const TOTAL_FORM_STEPS = 3;

export function DoctorOnboardingWizard() {
  return <OnboardingWizardInner />;
}

export default function OnboardingWizard() {
  return <OnboardingWizardInner />;
}

function OnboardingWizardInner() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<Dir>("next");
  const [data, setData] = useState<WizardData>({});

  const advance = (stepData: WizardData) => {
    setData((d) => ({ ...d, ...stepData }));
    setDir("next");
    setStep((s) => s + 1);
  };

  const back = () => {
    setDir("prev");
    setStep((s) => Math.max(0, s - 1));
  };

  const progress =
    step >= TOTAL_FORM_STEPS
      ? 100
      : Math.round(((step + 1) / TOTAL_FORM_STEPS) * 100);

  return (
    <div className="ob-wrap">
      <OnboardingLeft step={step} />

      <main className="ob-right">
        {step < TOTAL_FORM_STEPS && (
          <div className="ob-progress-wrap">
            <div className="ob-progress-bar">
              <motion.div
                className="ob-progress-fill"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
            <span className="ob-progress-label">
              Step {step + 1} of {TOTAL_FORM_STEPS}
            </span>
          </div>
        )}

        <div key={step} className={`ob-card ob-anim-${dir}`}>
          {step === 0 && <Step1Auth onSubmit={advance} />}
          {step === 1 && <Step2Verification onSubmit={advance} onBack={back} />}
          {step === 2 && <Step3Profile onSubmit={advance} onBack={back} />}
          {step === 3 && <Step4Pending />}
        </div>
      </main>
    </div>
  );
}
