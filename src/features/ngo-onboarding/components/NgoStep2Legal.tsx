"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { legalSchema, type LegalData } from "../schemas";
import { REGISTRATION_AUTHORITIES, REGISTRATION_TYPES } from "../types";

interface Props {
  defaultValues?: Partial<LegalData>;
  onSubmit: (data: LegalData) => void;
}

export default function NgoStep2Legal({ defaultValues, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LegalData>({
    resolver: zodResolver(legalSchema),
    // Flag a mistake as soon as the user leaves the field, then keep
    // re-checking as they correct it.
    mode: "onTouched",
    defaultValues: { expiryDate: "", ntn: "", ...defaultValues },
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="hw-step-head">
        <span className="hw-eyebrow">Step 2 — Registration &amp; Legal</span>
        <h1 className="hw-title">How is your NGO registered?</h1>
        <p className="hw-desc">
          These details are checked by hand against the register of the
          authority that issued them. Enter them exactly as they appear on your
          certificate.
        </p>
      </div>

      <form id="hw-step-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="hw-grid-2">
          <div className="hw-field">
            <label className="hw-label" htmlFor="authority">
              Registration authority <span className="hw-req">*</span>
            </label>
            <select
              {...register("authority")}
              id="authority"
              defaultValue=""
              className={`hw-input hw-select${errors.authority ? " hw-input-err" : ""}`}
            >
              <option value="" disabled>
                Select authority
              </option>
              {REGISTRATION_AUTHORITIES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {errors.authority && (
              <span className="hw-err-msg">{errors.authority.message}</span>
            )}
          </div>
          <div className="hw-field">
            <label className="hw-label" htmlFor="registrationType">
              Registration type <span className="hw-req">*</span>
            </label>
            <select
              {...register("registrationType")}
              id="registrationType"
              defaultValue=""
              className={`hw-input hw-select${errors.registrationType ? " hw-input-err" : ""}`}
            >
              <option value="" disabled>
                Select type
              </option>
              {REGISTRATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.registrationType && (
              <span className="hw-err-msg">
                {errors.registrationType.message}
              </span>
            )}
          </div>
        </div>

        <div className="hw-field hw-mt-lg">
          <label className="hw-label" htmlFor="registrationNumber">
            Registration number <span className="hw-req">*</span>
          </label>
          <input
            {...register("registrationNumber")}
            id="registrationNumber"
            type="text"
            placeholder="As printed on your certificate"
            className={`hw-input${errors.registrationNumber ? " hw-input-err" : ""}`}
          />
          {errors.registrationNumber && (
            <span className="hw-err-msg">
              {errors.registrationNumber.message}
            </span>
          )}
        </div>

        <div className="hw-grid-2 hw-mt-lg">
          <div className="hw-field">
            <label className="hw-label" htmlFor="registrationDate">
              Registration date <span className="hw-req">*</span>
            </label>
            <input
              {...register("registrationDate")}
              id="registrationDate"
              type="date"
              max={today}
              className={`hw-input${errors.registrationDate ? " hw-input-err" : ""}`}
            />
            {errors.registrationDate && (
              <span className="hw-err-msg">
                {errors.registrationDate.message}
              </span>
            )}
          </div>
          <div className="hw-field">
            <label className="hw-label" htmlFor="expiryDate">
              Registration / renewal expiry{" "}
              <span className="hw-opt-tag">optional</span>
            </label>
            <input
              {...register("expiryDate")}
              id="expiryDate"
              type="date"
              className={`hw-input${errors.expiryDate ? " hw-input-err" : ""}`}
            />
            <span className="hw-hint">
              Leave blank if your registration does not expire.
            </span>
            {errors.expiryDate && (
              <span className="hw-err-msg">{errors.expiryDate.message}</span>
            )}
          </div>
        </div>

        <div className="hw-field hw-mt-lg">
          <label className="hw-label" htmlFor="ntn">
            NTN / tax number <span className="hw-opt-tag">optional</span>
          </label>
          <input
            {...register("ntn")}
            id="ntn"
            type="text"
            className={`hw-input${errors.ntn ? " hw-input-err" : ""}`}
          />
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
            Supporting information only. Not every NGO holds the same tax
            documents.
          </div>
          {errors.ntn && (
            <span className="hw-err-msg">{errors.ntn.message}</span>
          )}
        </div>
      </form>
    </div>
  );
}
