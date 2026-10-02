"use client";

export interface RegistrationStep {
  id: number;
  label: string;
}

/** Numbered stepper dots + labels. `step` is the 0-based current step. */
export function RegistrationStepper({
  steps,
  step,
}: {
  steps: RegistrationStep[];
  step: number;
}) {
  return (
    <div className="hw-stepper">
      {steps.map((s, i) => (
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
          {i < steps.length - 1 && (
            <div
              className={`hw-step-line ${i < step ? "hw-step-line-done" : ""}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
