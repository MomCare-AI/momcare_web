"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1Schema, type Step1Data } from "./hwSchemas";

interface Props {
  defaultValues?: Partial<Step1Data>;
  onSubmit: (data: Step1Data) => void;
}

export default function HwStep1Personal({ defaultValues, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues,
  });

  return (
    <div>
      <div className="hw-step-head">
        <span className="hw-eyebrow">Step 1 — Account Setup</span>
        <h1 className="hw-title">Create your owner account</h1>
        <p className="hw-desc">
          Register yourself as the hospital or organization owner. Your account
          starts unverified until the email link is confirmed.
        </p>
      </div>

      <form id="hw-step-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="hw-grid-2">
          <div className="hw-field">
            <label className="hw-label">
              First name <span className="hw-req">*</span>
            </label>
            <input
              {...register("firstName")}
              type="text"
              autoComplete="given-name"
              placeholder="John"
              className={`hw-input${errors.firstName ? " hw-input-err" : ""}`}
            />
            {errors.firstName && (
              <span className="hw-err-msg">{errors.firstName.message}</span>
            )}
          </div>
          <div className="hw-field">
            <label className="hw-label">
              Last name <span className="hw-req">*</span>
            </label>
            <input
              {...register("lastName")}
              type="text"
              autoComplete="family-name"
              placeholder="Smith"
              className={`hw-input${errors.lastName ? " hw-input-err" : ""}`}
            />
            {errors.lastName && (
              <span className="hw-err-msg">{errors.lastName.message}</span>
            )}
          </div>
        </div>

        <div className="hw-field hw-mt">
          <label className="hw-label">
            Email address <span className="hw-req">*</span>
          </label>
          <input
            {...register("email")}
            type="email"
            autoComplete="username"
            placeholder="owner@yourhospital.com"
            className={`hw-input${errors.email ? " hw-input-err" : ""}`}
          />
          <span className="hw-hint">
            Login identifier — unique, case-insensitive. Verification link sent
            here.
          </span>
          {errors.email && (
            <span className="hw-err-msg">{errors.email.message}</span>
          )}
        </div>

        <div className="hw-grid-2 hw-mt-lg">
          <div className="hw-field">
            <label className="hw-label">
              Password <span className="hw-req">*</span>
            </label>
            <input
              {...register("password")}
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className={`hw-input${errors.password ? " hw-input-err" : ""}`}
            />
            <span className="hw-hint">
              Min length + uppercase + number required.
            </span>
            {errors.password && (
              <span className="hw-err-msg">{errors.password.message}</span>
            )}
          </div>
          <div className="hw-field">
            <label className="hw-label">
              Confirm password <span className="hw-req">*</span>
            </label>
            <input
              {...register("confirmPassword")}
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              className={`hw-input${errors.confirmPassword ? " hw-input-err" : ""}`}
            />
            <span className="hw-hint">Frontend-only match check.</span>
            {errors.confirmPassword && (
              <span className="hw-err-msg">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>
        </div>

        <div className="hw-grid-2 hw-mt-lg">
          <div className="hw-field">
            <label className="hw-label">Phone number</label>
            <input
              {...register("phoneNumber")}
              type="tel"
              placeholder="+1 555 000 0000"
              className="hw-input"
            />
            <span className="hw-hint">
              Unique if provided. Used for OTP later if added.
            </span>
          </div>
          <div className="hw-field">
            <label className="hw-label">Gender</label>
            <select
              {...register("gender")}
              className="hw-input hw-select"
              defaultValue=""
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
