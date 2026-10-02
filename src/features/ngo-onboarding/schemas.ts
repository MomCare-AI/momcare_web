import { z } from "zod";

import {
  DESIGNATIONS,
  REGISTRATION_AUTHORITIES,
  REGISTRATION_TYPES,
} from "./types";
import { PROVINCES } from "./data/pakistan";

const required = (msg: string) => z.string().trim().min(1, msg);

export const orgInfoSchema = z.object({
  orgName: z
    .string()
    .trim()
    .min(2, "Organization name is required")
    .max(200, "Max 200 characters"),
  orgEmail: z.string().trim().email("Enter a valid email address"),
  orgPhone: z
    .string()
    .trim()
    .refine(
      (v) => v.replace(/\D/g, "").length >= 7,
      "Enter a valid phone number"
    ),
  website: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^https?:\/\/\S+\.\S+$/.test(v),
      "Enter a full URL, e.g. https://example.org"
    ),
  province: z.enum(PROVINCES, { message: "Select a province" }),
  district: required("Select a district"),
  address: z.string().trim().min(5, "Enter the official address"),
  areasOfOperation: z
    .array(z.string())
    .min(1, "Choose at least one area of operation"),
});

const isoDate = (msg: string) =>
  z
    .string()
    .min(1, msg)
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date");

export const legalSchema = z
  .object({
    authority: z.enum(REGISTRATION_AUTHORITIES, {
      message: "Select the registration authority",
    }),
    registrationType: z.enum(REGISTRATION_TYPES, {
      message: "Select the registration type",
    }),
    registrationNumber: z
      .string()
      .trim()
      .min(2, "Registration number is required")
      .max(100, "Max 100 characters"),
    registrationDate: isoDate("Registration date is required").refine(
      (v) => Date.parse(v) <= Date.now(),
      "Registration date cannot be in the future"
    ),
    expiryDate: z.string(),
    ntn: z.string().trim().max(50, "Max 50 characters"),
  })
  .refine(
    (d) =>
      d.expiryDate === "" ||
      Date.parse(d.expiryDate) >= Date.parse(d.registrationDate),
    {
      message: "Expiry cannot be before the registration date",
      path: ["expiryDate"],
    }
  );

export const CNIC_PATTERN = /^\d{5}-\d{7}-\d$/;

/** Formats digits as XXXXX-XXXXXXX-X while typing. */
export function formatCnic(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export const representativeSchema = z.object({
  repName: z.string().trim().min(2, "Full name is required"),
  cnic: z.string().trim().regex(CNIC_PATTERN, "Use the format XXXXX-XXXXXXX-X"),
  designation: z.enum(DESIGNATIONS, { message: "Select a designation" }),
  repEmail: z.string().trim().email("Enter a valid email address"),
  repPhone: z
    .string()
    .trim()
    .refine(
      (v) => v.replace(/\D/g, "").length >= 7,
      "Enter a valid phone number"
    ),
});

export type OrgInfoData = z.infer<typeof orgInfoSchema>;
export type LegalData = z.infer<typeof legalSchema>;
export type RepresentativeData = z.infer<typeof representativeSchema>;

export type NgoRegistrationData = OrgInfoData & LegalData & RepresentativeData;
