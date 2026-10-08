import { z } from "zod";

import {
  zAddressLine,
  zEmail,
  zOrgName,
  zPersonName,
  zPhone,
  zPlace,
  zPostalCode,
  zRegistrationNumber,
} from "@/shared/lib/validation";

export const step1Schema = z
  .object({
    firstName: zPersonName("First name"),
    lastName: zPersonName("Last name"),
    email: zEmail("Email address"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
    phoneNumber: zPhone("Phone number", false).optional(),
    // The <select>'s own default option submits "" (not undefined) — accept
    // it directly rather than rejecting the field's own unset state.
    gender: z
      .union([z.enum(["male", "female", "other", "unknown"]), z.literal("")])
      .optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const orgStep1Schema = z.object({
  orgName: zOrgName("Organization name"),
});

export const orgStep2Schema = z.object({
  contactEmail: zEmail("Email address"),
  contactPhone: zPhone("Phone number", true),
});

export const orgStep3Schema = z.object({
  addressLine1: zAddressLine("Address"),
  addressLine2: zAddressLine("Address line 2", false).optional(),
  city: zPlace("City"),
  stateProvince: zPlace("State / province"),
  postalCode: zPostalCode(),
  country: zPlace("Country"),
  licenseNo: zRegistrationNumber("License / registration number"),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type OrgStep1Data = z.infer<typeof orgStep1Schema>;
export type OrgStep2Data = z.infer<typeof orgStep2Schema>;
export type OrgStep3Data = z.infer<typeof orgStep3Schema>;
