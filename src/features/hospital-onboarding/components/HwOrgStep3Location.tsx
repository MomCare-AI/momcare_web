"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  orgStep3Schema,
  LICENSE_AUTHORITIES,
  type OrgStep3Data,
} from "./hwSchemas";

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Brazil",
  "Bulgaria",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Congo (DRC)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Estonia",
  "Ethiopia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Guatemala",
  "Honduras",
  "Hungary",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Kyrgyzstan",
  "Latvia",
  "Lebanon",
  "Libya",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Mali",
  "Mexico",
  "Moldova",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Nigeria",
  "Norway",
  "Oman",
  "Pakistan",
  "Palestine",
  "Panama",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Somalia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

interface Props {
  defaultValues?: Partial<OrgStep3Data>;
  onSubmit: (data: OrgStep3Data) => void;
  onBack: () => void;
}

export default function HwOrgStep3Location({
  defaultValues,
  onSubmit,
  onBack,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgStep3Data>({
    resolver: zodResolver(orgStep3Schema),
    defaultValues,
  });

  return (
    <div>
      <div className="hw-step-head">
        <span className="hw-eyebrow">Step 4 — Location &amp; Credentials</span>
        <h1 className="hw-title">Address &amp; registration details</h1>
        <p className="hw-desc">
          Used by our review team to cross-check your organization against
          public records. City is used for the reviewer's public lookup check.
        </p>
      </div>

      <form id="hw-step-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="hw-field">
          <label className="hw-label">
            Address line 1 <span className="hw-req">*</span>
          </label>
          <input
            {...register("addressLine1")}
            type="text"
            placeholder="Street address, P.O. box, company name"
            className={`hw-input${errors.addressLine1 ? " hw-input-err" : ""}`}
          />
          {errors.addressLine1 && (
            <span className="hw-err-msg">{errors.addressLine1.message}</span>
          )}
        </div>

        <div className="hw-field hw-mt">
          <label className="hw-label">
            Address line 2 <span className="hw-opt-tag">optional</span>
          </label>
          <input
            {...register("addressLine2")}
            type="text"
            placeholder="Apartment, suite, unit, building, floor"
            className="hw-input"
          />
        </div>

        <div className="hw-grid-2 hw-mt">
          <div className="hw-field">
            <label className="hw-label">
              City <span className="hw-req">*</span>
            </label>
            <input
              {...register("city")}
              type="text"
              placeholder="e.g. London"
              className={`hw-input${errors.city ? " hw-input-err" : ""}`}
            />
            <span className="hw-hint">
              Used for reviewer's public lookup check.
            </span>
            {errors.city && (
              <span className="hw-err-msg">{errors.city.message}</span>
            )}
          </div>
          <div className="hw-field">
            <label className="hw-label">
              State / Province <span className="hw-req">*</span>
            </label>
            <input
              {...register("stateProvince")}
              type="text"
              placeholder="e.g. England"
              className={`hw-input${errors.stateProvince ? " hw-input-err" : ""}`}
            />
            {errors.stateProvince && (
              <span className="hw-err-msg">{errors.stateProvince.message}</span>
            )}
          </div>
        </div>

        <div className="hw-grid-2 hw-mt">
          <div className="hw-field">
            <label className="hw-label">
              Postal code <span className="hw-req">*</span>
            </label>
            <input
              {...register("postalCode")}
              type="text"
              placeholder="e.g. SW1A 1AA"
              className={`hw-input${errors.postalCode ? " hw-input-err" : ""}`}
            />
            {errors.postalCode && (
              <span className="hw-err-msg">{errors.postalCode.message}</span>
            )}
          </div>
          <div className="hw-field">
            <label className="hw-label">
              Country <span className="hw-req">*</span>
            </label>
            <select
              {...register("country")}
              defaultValue=""
              className={`hw-input hw-select${errors.country ? " hw-input-err" : ""}`}
            >
              <option value="" disabled>
                Select country
              </option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.country && (
              <span className="hw-err-msg">{errors.country.message}</span>
            )}
          </div>
        </div>

        <div className="hw-field hw-mt-lg">
          <label className="hw-label">
            Issuing authority <span className="hw-req">*</span>
          </label>
          <select
            {...register("licenseAuthority")}
            defaultValue=""
            className={`hw-input hw-select${errors.licenseAuthority ? " hw-input-err" : ""}`}
          >
            <option value="" disabled>
              Select the regulator that licensed your facility
            </option>
            {LICENSE_AUTHORITIES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <span className="hw-hint">
            Hospitals and clinics are licensed provincially, not by PMDC.
          </span>
          {errors.licenseAuthority && (
            <span className="hw-err-msg">
              {errors.licenseAuthority.message}
            </span>
          )}
        </div>

        <div className="hw-field hw-mt">
          <label className="hw-label">
            Self-declared license / registration no.{" "}
            <span className="hw-req">*</span>
          </label>
          <input
            {...register("licenseNo")}
            type="text"
            placeholder="e.g. PHC-2026-LHR-441"
            className={`hw-input${errors.licenseNo ? " hw-input-err" : ""}`}
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
            Not verified against a live registry — strengthens the reviewer's
            judgment call.
          </div>
          {errors.licenseNo && (
            <span className="hw-err-msg">{errors.licenseNo.message}</span>
          )}
        </div>
      </form>
    </div>
  );
}
