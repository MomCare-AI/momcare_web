"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { DISTRICTS, PROVINCES, type Province } from "../data/pakistan";
import { orgInfoSchema, type OrgInfoData } from "../schemas";

interface Props {
  defaultValues?: Partial<OrgInfoData>;
  onSubmit: (data: OrgInfoData) => void;
}

export default function NgoStep1Organization({
  defaultValues,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrgInfoData>({
    resolver: zodResolver(orgInfoSchema),
    defaultValues: { areasOfOperation: [], website: "", ...defaultValues },
  });

  const province = watch("province") as Province | undefined;
  const areas = watch("areasOfOperation") ?? [];
  const districts = province ? DISTRICTS[province] : [];

  const toggleArea = (p: string) =>
    setValue(
      "areasOfOperation",
      areas.includes(p) ? areas.filter((a) => a !== p) : [...areas, p],
      { shouldValidate: true }
    );

  return (
    <div>
      <div className="hw-step-head">
        <span className="hw-eyebrow">Step 1 — Organization Information</span>
        <h1 className="hw-title">Tell us about your organization</h1>
        <p className="hw-desc">
          Basic details about your NGO and where it works. A MomCare reviewer
          checks these against your registration documents before any account is
          created.
        </p>
      </div>

      <form id="hw-step-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="hw-field">
          <label className="hw-label" htmlFor="orgName">
            Organization name <span className="hw-req">*</span>
          </label>
          <input
            {...register("orgName")}
            id="orgName"
            type="text"
            autoComplete="organization"
            placeholder="e.g. Helping Hands Foundation"
            className={`hw-input hw-input-lg${errors.orgName ? " hw-input-err" : ""}`}
          />
          {errors.orgName && (
            <span className="hw-err-msg">{errors.orgName.message}</span>
          )}
        </div>

        <div className="hw-grid-2 hw-mt-lg">
          <div className="hw-field">
            <label className="hw-label" htmlFor="orgEmail">
              Official email <span className="hw-req">*</span>
            </label>
            <input
              {...register("orgEmail")}
              id="orgEmail"
              type="email"
              autoComplete="email"
              placeholder="info@yourngo.org"
              className={`hw-input${errors.orgEmail ? " hw-input-err" : ""}`}
            />
            {errors.orgEmail && (
              <span className="hw-err-msg">{errors.orgEmail.message}</span>
            )}
          </div>
          <div className="hw-field">
            <label className="hw-label" htmlFor="orgPhone">
              Official phone <span className="hw-req">*</span>
            </label>
            <input
              {...register("orgPhone")}
              id="orgPhone"
              type="tel"
              autoComplete="tel"
              placeholder="+92 300 1234567"
              className={`hw-input${errors.orgPhone ? " hw-input-err" : ""}`}
            />
            {errors.orgPhone && (
              <span className="hw-err-msg">{errors.orgPhone.message}</span>
            )}
          </div>
        </div>

        <div className="hw-field hw-mt-lg">
          <label className="hw-label" htmlFor="website">
            Website <span className="hw-opt-tag">optional</span>
          </label>
          <input
            {...register("website")}
            id="website"
            type="url"
            placeholder="https://yourngo.org"
            className={`hw-input${errors.website ? " hw-input-err" : ""}`}
          />
          {errors.website && (
            <span className="hw-err-msg">{errors.website.message}</span>
          )}
        </div>

        <div className="hw-grid-2 hw-mt-lg">
          <div className="hw-field">
            <label className="hw-label" htmlFor="province">
              Province / administrative area <span className="hw-req">*</span>
            </label>
            <select
              {...register("province", {
                onChange: () => setValue("district", ""),
              })}
              id="province"
              defaultValue=""
              className={`hw-input hw-select${errors.province ? " hw-input-err" : ""}`}
            >
              <option value="" disabled>
                Select province
              </option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {errors.province && (
              <span className="hw-err-msg">{errors.province.message}</span>
            )}
          </div>
          <div className="hw-field">
            <label className="hw-label" htmlFor="district">
              District <span className="hw-req">*</span>
            </label>
            <select
              {...register("district")}
              id="district"
              defaultValue=""
              disabled={!province}
              className={`hw-input hw-select${errors.district ? " hw-input-err" : ""}`}
            >
              <option value="" disabled>
                {province ? "Select district" : "Choose a province first"}
              </option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.district && (
              <span className="hw-err-msg">{errors.district.message}</span>
            )}
          </div>
        </div>

        <div className="hw-field hw-mt-lg">
          <label className="hw-label" htmlFor="address">
            Official address <span className="hw-req">*</span>
          </label>
          <textarea
            {...register("address")}
            id="address"
            rows={3}
            autoComplete="street-address"
            placeholder="Office address as on your registration documents"
            className={`hw-input${errors.address ? " hw-input-err" : ""}`}
          />
          {errors.address && (
            <span className="hw-err-msg">{errors.address.message}</span>
          )}
        </div>

        <div className="hw-field hw-mt-lg">
          <span className="hw-label" id="areas-label">
            Areas of operation <span className="hw-req">*</span>
          </span>
          <div
            className="hw-chip-row"
            role="group"
            aria-labelledby="areas-label"
          >
            {PROVINCES.map((p) => {
              const on = areas.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleArea(p)}
                  className={`hw-chip${on ? " hw-chip-on" : ""}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <span className="hw-hint">
            Select every province or area where you deliver services.
          </span>
          {errors.areasOfOperation && (
            <span className="hw-err-msg">
              {errors.areasOfOperation.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
