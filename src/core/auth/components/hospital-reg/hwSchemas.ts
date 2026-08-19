import { z } from "zod";

export const step1Schema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "Max 50 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Max 50 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
    phoneNumber: z.string().optional(),
    gender: z.enum(["male", "female", "other", "unknown"]).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const orgStep1Schema = z.object({
  orgName: z
    .string()
    .min(2, "Organization name is required")
    .max(200, "Max 200 characters"),
});

export const orgStep2Schema = z.object({
  contactEmail: z.string().email("Enter a valid email address"),
  contactPhone: z.string().min(6, "Enter a valid phone number"),
});

export const orgStep3Schema = z.object({
  addressLine1: z.string().min(3, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  stateProvince: z.string().min(1, "State / province is required"),
  postalCode: z.string().min(2, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  licenseNo: z.string().min(2, "License / registration number is required"),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type OrgStep1Data = z.infer<typeof orgStep1Schema>;
export type OrgStep2Data = z.infer<typeof orgStep2Schema>;
export type OrgStep3Data = z.infer<typeof orgStep3Schema>;
