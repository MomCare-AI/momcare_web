/**
 * One place for what a valid value looks like, so every form agrees.
 *
 * Two layers are used together:
 *  - a `keep…` filter, run as the user types or pastes, so a character that can
 *    never be valid in that field (a digit in a name, a letter in a phone
 *    number) is not accepted at all;
 *  - a `check…` rule, run on submit (and in the zod schemas), which returns a
 *    short message for the first problem, or `null` when the value is fine.
 *
 * The server validates as well; this only keeps obvious mistakes from ever
 * leaving the browser.
 */

import { useState } from "react";
import { z } from "zod";

/* ── Characters ──────────────────────────────────────────────────────── */

const LETTER = "\\p{L}\\p{M}";

// Letters from any alphabet (names are not only English), plus the few
// punctuation marks real names use.
const NAME_CHARS = new RegExp(`[^${LETTER} .'’-]`, "gu");
const PLACE_CHARS = new RegExp(`[^${LETTER} .'’-]`, "gu");
const PHONE_CHARS = /[^\d+\-() ]/g;
const CNIC_CHARS = /[^\d-]/g;
const DIGITS = /[^\d]/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/* ── Input filters (as the user types) ───────────────────────────────── */

/** A person's name: letters, spaces, . ' - only. */
export const keepName = (v: string) =>
  v
    .replace(NAME_CHARS, "")
    .replace(/^[\s.'’-]+/, "")
    .slice(0, 60);

/** City, state, country. */
export const keepPlace = (v: string) =>
  v
    .replace(PLACE_CHARS, "")
    .replace(/^[\s.'’-]+/, "")
    .slice(0, 80);

/** Phone numbers: digits, a leading +, spaces, dashes, brackets. */
export const keepPhone = (v: string) => v.replace(PHONE_CHARS, "").slice(0, 20);

/** CNIC: digits and dashes. */
export const keepCnic = (v: string) => v.replace(CNIC_CHARS, "").slice(0, 15);

/** Whole numbers only. */
export const keepDigits = (v: string, max = 10) =>
  v.replace(DIGITS, "").slice(0, max);

/** Free text: drop control characters, cap the length. */
export const keepText = (v: string, max = 2000) =>
  v.replace(CONTROL_CHARS, "").slice(0, max);

/* ── Rules (on submit) ───────────────────────────────────────────────── */

export type Rule = string | null;

const NAME_RE = new RegExp(
  `^[${LETTER}](?:[${LETTER} .'’-]*[${LETTER}.])?$`,
  "u"
);

/** A person's name. `label` reads naturally in the message ("First name"). */
export function checkPersonName(
  value: string,
  label = "Name",
  { required = true }: { required?: boolean } = {}
): Rule {
  const v = value.trim();
  if (!v) return required ? `${label} is required.` : null;
  if (/\d/.test(v)) return `${label} cannot contain numbers.`;
  if (v.length < 2) return `${label} must be at least 2 letters.`;
  if (v.length > 60) return `${label} must be 60 characters or fewer.`;
  if (!NAME_RE.test(v)) {
    return `${label} can only contain letters, spaces, hyphens, apostrophes and full stops.`;
  }
  if (/([ .'’-])\1/.test(v)) return `${label} has repeated punctuation.`;
  return null;
}

/** City, state / province, country. */
export function checkPlace(
  value: string,
  label: string,
  { required = true }: { required?: boolean } = {}
): Rule {
  const v = value.trim();
  if (!v) return required ? `${label} is required.` : null;
  if (/\d/.test(v)) return `${label} cannot contain numbers.`;
  if (v.length < 2) return `${label} is too short.`;
  if (v.length > 80) return `${label} is too long.`;
  if (!NAME_RE.test(v))
    return `${label} contains characters that are not allowed.`;
  return null;
}

/** A phone number: 7 to 15 digits, optionally with a leading +. */
export function checkPhone(
  value: string,
  label = "Phone number",
  { required = false }: { required?: boolean } = {}
): Rule {
  const v = value.trim();
  if (!v) return required ? `${label} is required.` : null;
  if (/[^\d+\-() ]/.test(v)) {
    return `${label} can only contain digits, spaces, + and dashes.`;
  }
  if (v.indexOf("+") > 0 || (v.match(/\+/g)?.length ?? 0) > 1) {
    return `${label}: the + can only be at the start.`;
  }
  const digits = v.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return `${label} must have 7 to 15 digits.`;
  }
  if (/^(\d)\1+$/.test(digits)) return `${label} does not look real.`;
  return null;
}

export function checkEmail(
  value: string,
  label = "Email",
  { required = true }: { required?: boolean } = {}
): Rule {
  const v = value.trim();
  if (!v) return required ? `${label} is required.` : null;
  if (v.length > 254) return `${label} is too long.`;
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v)) {
    return `Enter a valid ${label.toLowerCase()}, like name@hospital.com.`;
  }
  return null;
}

/** Pakistani CNIC: 13 digits, with or without the two dashes. */
export function checkCnic(value: string, { required = false } = {}): Rule {
  const v = value.trim();
  if (!v) return required ? "CNIC is required." : null;
  if (!/^\d{5}-?\d{7}-?\d$/.test(v)) {
    return "CNIC must be 13 digits, like 61101-1234567-8.";
  }
  return null;
}

/** A hospital, clinic or organisation name: letters first, digits allowed. */
export function checkOrgName(value: string, label = "Name"): Rule {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `${label} is too short.`;
  if (v.length > 200) return `${label} must be 200 characters or fewer.`;
  if (!new RegExp(`[${LETTER}]`, "u").test(v)) {
    return `${label} must contain letters.`;
  }
  if (!new RegExp(`^[${LETTER}\\d &.,'’()/-]+$`, "u").test(v)) {
    return `${label} contains characters that are not allowed.`;
  }
  return null;
}

/** A street address line. */
export function checkAddressLine(
  value: string,
  label = "Address",
  { required = true }: { required?: boolean } = {}
): Rule {
  const v = value.trim();
  if (!v) return required ? `${label} is required.` : null;
  if (v.length < 3) return `${label} is too short.`;
  if (v.length > 200) return `${label} must be 200 characters or fewer.`;
  if (!new RegExp(`[${LETTER}\\d]`, "u").test(v)) {
    return `${label} must contain letters or numbers.`;
  }
  if (!new RegExp(`^[${LETTER}\\d ,.#/&'’()-]+$`, "u").test(v)) {
    return `${label} contains characters that are not allowed.`;
  }
  return null;
}

export function checkPostalCode(
  value: string,
  { required = true }: { required?: boolean } = {}
): Rule {
  const v = value.trim();
  if (!v) return required ? "Postal code is required." : null;
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,8}[A-Za-z0-9]$/.test(v)) {
    return "Postal code must be 3 to 10 letters or numbers.";
  }
  return null;
}

/** A registration / licence number. */
export function checkRegistrationNumber(
  value: string,
  label = "Registration number"
): Rule {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (!/^[A-Za-z0-9][A-Za-z0-9 ./-]{1,38}[A-Za-z0-9]$/.test(v)) {
    return `${label} must be 3 to 40 letters or numbers (dashes and slashes allowed).`;
  }
  return null;
}

/** A short label such as a tag or status name. */
export function checkLabel(
  value: string,
  label = "Name",
  { max = 50 }: { max?: number } = {}
): Rule {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (v.length > max) return `${label} must be ${max} characters or fewer.`;
  if (!new RegExp(`[${LETTER}\\d]`, "u").test(v)) {
    return `${label} must contain letters or numbers.`;
  }
  return null;
}

export function checkText(
  value: string,
  label: string,
  { required = false, max = 2000 }: { required?: boolean; max?: number } = {}
): Rule {
  const v = value.trim();
  if (!v) return required ? `${label} is required.` : null;
  if (v.length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
}

/** A whole number between `min` and `max`. Empty is allowed unless required. */
export function checkWholeNumber(
  value: string,
  label: string,
  min: number,
  max: number,
  { required = false }: { required?: boolean } = {}
): Rule {
  const v = value.trim();
  if (!v) return required ? `${label} is required.` : null;
  if (!/^\d+$/.test(v)) return `${label} must be a whole number.`;
  const n = Number(v);
  if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
  return null;
}

/** A decimal number between `min` and `max`. */
export function checkNumberInRange(
  value: string,
  label: string,
  min: number,
  max: number,
  { required = false }: { required?: boolean } = {}
): Rule {
  const v = value.trim();
  if (!v) return required ? `${label} is required.` : null;
  if (!/^\d+(\.\d+)?$/.test(v)) return `${label} must be a number.`;
  const n = Number(v);
  if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
  return null;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/** A date of birth: a real date, not in the future, not over 120 years ago. */
export function checkDateOfBirth(
  value: string,
  { required = false }: { required?: boolean } = {}
): Rule {
  const v = value.trim();
  if (!v) return required ? "Date of birth is required." : null;
  const d = new Date(`${v}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Enter a valid date of birth.";
  if (v > todayIso()) return "Date of birth cannot be in the future.";
  const years = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (years > 120) return "Check the date of birth: it is over 120 years ago.";
  return null;
}

/** The portal's password rule: 8+ characters, an uppercase letter and a number. */
export function checkPassword(value: string, label = "Password"): Rule {
  if (!value) return `${label} is required.`;
  if (value.length < 8) return `${label} must be at least 8 characters.`;
  if (value.length > 128) return `${label} is too long.`;
  if (!/[A-Z]/.test(value)) return `${label} needs an uppercase letter.`;
  if (!/[0-9]/.test(value)) return `${label} needs a number.`;
  return null;
}

/** The first problem among several rule results, or `null`. */
export const firstProblem = (...rules: Rule[]): Rule =>
  rules.find((r) => r !== null) ?? null;

/* ── zod building blocks (for the react-hook-form wizards) ───────────── */

const refine =
  (rule: (v: string) => Rule) => (v: string, ctx: z.RefinementCtx) => {
    const message = rule(v);
    if (message) ctx.addIssue({ code: "custom", message });
  };

export const zPersonName = (label: string, required = true) =>
  z
    .string()
    .superRefine(refine((v) => checkPersonName(v, label, { required })));

export const zPlace = (label: string, required = true) =>
  z.string().superRefine(refine((v) => checkPlace(v, label, { required })));

export const zPhone = (label = "Phone number", required = false) =>
  z.string().superRefine(refine((v) => checkPhone(v, label, { required })));

export const zEmail = (label = "Email") =>
  z.string().superRefine(refine((v) => checkEmail(v, label)));

export const zOrgName = (label = "Name") =>
  z.string().superRefine(refine((v) => checkOrgName(v, label)));

export const zAddressLine = (label = "Address", required = true) =>
  z
    .string()
    .superRefine(refine((v) => checkAddressLine(v, label, { required })));

export const zPostalCode = () =>
  z.string().superRefine(refine((v) => checkPostalCode(v)));

export const zRegistrationNumber = (label = "Registration number") =>
  z.string().superRefine(refine((v) => checkRegistrationNumber(v, label)));

/**
 * Wraps react-hook-form's `register(...)` so what is typed or pasted is
 * cleaned by `filter` before the form library sees it:
 * `<input {...filtered(register("firstName"), keepName)} />`.
 */
export function filtered<
  R extends {
    onChange: (event: { target: unknown; type?: unknown }) => unknown;
  },
>(reg: R, filter: (value: string) => string): R {
  return {
    ...reg,
    onChange: (event: { target: unknown; type?: unknown }) => {
      const target = event.target as { value?: string };
      if (typeof target?.value === "string")
        target.value = filter(target.value);
      return reg.onChange(event);
    },
  };
}

/* ── Check a field as soon as the user leaves it ─────────────────────── */

/**
 * Per-field messages for a form that keeps its own state.
 *
 * `rules` returns the current problem (or `null`) for each field, from the
 * form's present values. A field is "touched" when focus leaves it (`touch`)
 * or when the form is submitted (`validateAll`); from then on its message is
 * worked out live, so it appears the moment the user moves on and disappears
 * the moment the value is fixed.
 */
export function useFieldChecks(rules: () => Record<string, Rule>) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) =>
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));

  const error = (field: string): string | undefined =>
    touched[field] ? (rules()[field] ?? undefined) : undefined;

  /** Marks every field and returns the first problem, or `null`. */
  const validateAll = (): Rule => {
    const all = rules();
    setTouched(Object.fromEntries(Object.keys(all).map((k) => [k, true])));
    return Object.values(all).find((r) => r !== null) ?? null;
  };

  const reset = () => setTouched({});

  return { touch, error, validateAll, reset };
}
