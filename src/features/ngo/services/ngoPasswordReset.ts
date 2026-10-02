import { DEMO_NGO_CREDENTIALS } from "../data/dummy";
import { setDemoNgoPassword } from "./ngoAuth";

/**
 * DEMO ONLY: the NGO "forgot password" flow, mirroring the hospital one
 * (`/api/auth/forgot-password/`, `verify-reset-token/`, `reset-password/`).
 * Tokens live in this module's memory and no email is sent. To go real,
 * replace the three functions with calls to the NGO auth API; the pages
 * don't change.
 */
export type NgoResetErrorKind = "rate_limit" | "dead_link" | "weak_password";

export class NgoResetError extends Error {
  constructor(
    message: string,
    readonly kind: NgoResetErrorKind
  ) {
    super(message);
  }
}

const LINK_LIFETIME_MS = 60 * 60 * 1000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

interface ResetToken {
  uid: string;
  token: string;
  email: string;
  createdAt: number;
  used: boolean;
}

let tokens: ResetToken[] = [];
let requestTimes: number[] = [];

const delay = () => new Promise((r) => setTimeout(r, 400));
const random = () => Math.random().toString(36).slice(2, 12);

export interface ResetRequestResult {
  /**
   * DEMO ONLY: the path the emailed link would open, so the flow can be tried
   * without an inbox. Always null for an address with no account, which also
   * keeps the response shape identical either way.
   */
  previewPath: string | null;
}

export async function requestNgoPasswordReset(
  email: string
): Promise<ResetRequestResult> {
  await delay();

  const now = Date.now();
  requestTimes = requestTimes.filter((t) => now - t < RATE_WINDOW_MS);
  if (requestTimes.length >= RATE_LIMIT) {
    throw new NgoResetError(
      "Too many attempts. Wait a minute and try again.",
      "rate_limit"
    );
  }
  requestTimes.push(now);

  // Same answer whether or not the address has an account.
  if (email.trim().toLowerCase() !== DEMO_NGO_CREDENTIALS.email) {
    return { previewPath: null };
  }
  const entry: ResetToken = {
    uid: random(),
    token: random() + random(),
    email: DEMO_NGO_CREDENTIALS.email,
    createdAt: now,
    used: false,
  };
  tokens.push(entry);
  return { previewPath: `/reset-password/ngo/${entry.uid}/${entry.token}` };
}

function findLive(uid: string, token: string): ResetToken {
  const entry = tokens.find((t) => t.uid === uid && t.token === token);
  if (!entry || entry.used || Date.now() - entry.createdAt > LINK_LIFETIME_MS) {
    throw new NgoResetError(
      "This reset link is not valid. It may have expired or already been used.",
      "dead_link"
    );
  }
  return entry;
}

export async function verifyNgoResetToken(
  uid: string,
  token: string
): Promise<void> {
  await delay();
  findLive(uid, token);
}

const COMMON = new Set([
  "password",
  "password1",
  "12345678",
  "123456789",
  "qwertyui",
  "iloveyou",
  "letmein1",
]);

/** Mirrors the wording of the server's password validators. */
export function validateNewPassword(
  password: string,
  email: string
): string | null {
  if (password.length < 8) {
    return "This password is too short. It must contain at least 8 characters.";
  }
  if (/^\d+$/.test(password)) return "This password is entirely numeric.";
  if (COMMON.has(password.toLowerCase())) return "This password is too common.";
  if (email && password.toLowerCase() === email.toLowerCase()) {
    return "The password is too similar to the email address.";
  }
  return null;
}

export async function resetNgoPassword(
  uid: string,
  token: string,
  newPassword: string
): Promise<void> {
  await delay();
  const entry = findLive(uid, token);
  const problem = validateNewPassword(newPassword, entry.email);
  if (problem) throw new NgoResetError(problem, "weak_password");
  entry.used = true;
  setDemoNgoPassword(newPassword);
}

/** Test hook: forget every token and rate-limit hit. */
export function resetNgoPasswordStateForTests(): void {
  tokens = [];
  requestTimes = [];
}
