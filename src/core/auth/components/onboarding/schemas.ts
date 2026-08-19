import { z } from "zod";

export const step1Schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export const step2Schema = z.object({
  cnic: z.string().regex(/^\d{5}-\d{7}-\d$/, "Format: XXXXX-XXXXXXX-X"),
  pmdc: z
    .string()
    .min(4, "Enter your PMDC registration number")
    .max(20, "PMDC number too long"),
});

export const step3Schema = z.object({
  specialty: z.string().min(1, "Select your primary specialty"),
  hospital: z.string().min(2, "Enter your hospital or clinic name"),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
