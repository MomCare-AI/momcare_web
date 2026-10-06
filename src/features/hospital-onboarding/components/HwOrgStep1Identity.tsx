"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orgStep1Schema, type OrgStep1Data } from "./hwSchemas";

interface Props {
  defaultValues?: Partial<OrgStep1Data>;
  onSubmit: (data: OrgStep1Data) => void;
  onBack: () => void;
}

export default function HwOrgStep1Identity({
  defaultValues,
  onSubmit,
  onBack,
}: Props) {
  void onBack;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgStep1Data>({
    resolver: zodResolver(orgStep1Schema),
    defaultValues,
  });

  return (
    <div>
      <div className="hw-step-head">
        <span className="hw-eyebrow">Step 2 — Organization Identity</span>
        <h1 className="hw-title">Name your organization</h1>
        <p className="hw-desc">
          Your application is reviewed by the MomCare team, and your hospital
          goes live once it is approved.
        </p>
      </div>

      <form id="hw-step-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="hw-field">
          <label className="hw-label" htmlFor="hw-org-name">
            Hospital / organization name <span className="hw-req">*</span>
          </label>
          <input
            {...register("orgName")}
            id="hw-org-name"
            type="text"
            placeholder="e.g. City General Hospital"
            className={`hw-input hw-input-lg${errors.orgName ? " hw-input-err" : ""}`}
          />
          {errors.orgName && (
            <span className="hw-err-msg">{errors.orgName.message}</span>
          )}
        </div>
      </form>
    </div>
  );
}
