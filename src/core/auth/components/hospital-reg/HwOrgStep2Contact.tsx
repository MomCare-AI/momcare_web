"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orgStep2Schema, type OrgStep2Data } from "./hwSchemas";

interface Props {
  defaultValues?: Partial<OrgStep2Data>;
  onSubmit: (data: OrgStep2Data) => void;
  onBack: () => void;
}

export default function HwOrgStep2Contact({
  defaultValues,
  onSubmit,
  onBack,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgStep2Data>({
    resolver: zodResolver(orgStep2Schema),
    defaultValues,
  });

  return (
    <div>
      <div className="hw-step-head">
        <span className="hw-eyebrow">Step 3 — Contact Details</span>
        <h1 className="hw-title">Official contact information</h1>
        <p className="hw-desc">
          Provide official contact details for your organization. These are used
          by our review team to cross-verify your organization independently.
        </p>
      </div>

      <form id="hw-step-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="hw-field">
          <label className="hw-label">
            Official contact email <span className="hw-req">*</span>
          </label>
          <div className="hw-input-wrap">
            <svg
              className="hw-input-icon"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M1.5 4.5A1.5 1.5 0 013 3h12a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0115 15H3a1.5 1.5 0 01-1.5-1.5v-9z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M1.5 4.5l7.5 5.25 7.5-5.25"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <input
              {...register("contactEmail")}
              type="email"
              placeholder="contact@yourhospital.com"
              className={`hw-input hw-input-icon-pad${errors.contactEmail ? " hw-input-err" : ""}`}
            />
          </div>
          <span className="hw-hint">
            Personal email accepted. A business-domain email is a plus during
            review, not a requirement.
          </span>
          {errors.contactEmail && (
            <span className="hw-err-msg">{errors.contactEmail.message}</span>
          )}
        </div>

        <div className="hw-field hw-mt">
          <label className="hw-label">
            Official contact phone <span className="hw-req">*</span>
          </label>
          <div className="hw-input-wrap">
            <svg
              className="hw-input-icon"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M3.75 2.25h3l1.5 3.75-1.875 1.125a9 9 0 004.5 4.5L12 9.75l3.75 1.5v3a1.5 1.5 0 01-1.5 1.5A12.75 12.75 0 012.25 3.75a1.5 1.5 0 011.5-1.5z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              {...register("contactPhone")}
              type="tel"
              placeholder="+1 555 000 0000"
              className={`hw-input hw-input-icon-pad${errors.contactPhone ? " hw-input-err" : ""}`}
            />
          </div>
          <div className="hw-info-badge">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle
                cx="7"
                cy="7"
                r="6"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M7 6.5V10M7 4.5v.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            Verified by OTP before submission is accepted.
          </div>
          {errors.contactPhone && (
            <span className="hw-err-msg">{errors.contactPhone.message}</span>
          )}
        </div>
      </form>
    </div>
  );
}
