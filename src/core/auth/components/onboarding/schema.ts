import { z } from "zod";

export const doctorOnboardingSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),

  cnic: z
    .string()
    .regex(
      /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/,
      "CNIC must be in the format XXXXX-XXXXXXX-X"
    ),
  pmdcNo: z.string().min(3, "PMDC Registration Number is required."),
  cnicFile: z.any().optional(),
  licenseFile: z.any().optional(),

  specialty: z.string().min(1, "Please select a primary specialty."),
  hospital: z.string().min(1, "Please enter an associated hospital or clinic."),
  profileFile: z.any().optional(),
});

export type DoctorOnboardingData = z.infer<typeof doctorOnboardingSchema>;
