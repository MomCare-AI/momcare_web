/**
 * The NGO account-recovery screens (demo-backed), mirroring the hospital ones
 * in password-flows.test.tsx: same wording, same dead-link and rate-limit
 * behaviour, same refusal to reveal whether an address has an account.
 */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEMO_NGO_CREDENTIALS } from "@/features/ngo/data/dummy";
import { setDemoNgoPassword, signInNgo } from "@/features/ngo/services/ngoAuth";
import {
  requestNgoPasswordReset,
  resetNgoPasswordStateForTests,
} from "@/features/ngo/services/ngoPasswordReset";
import { NgoForgotPasswordClient } from "./forgot-password/ngo/components/NgoForgotPasswordClient";
import { NgoResetPasswordClient } from "./reset-password/ngo/[uid]/[token]/components/NgoResetPasswordClient";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  resetNgoPasswordStateForTests();
  setDemoNgoPassword(DEMO_NGO_CREDENTIALS.password);
  sessionStorage.clear();
});

const type = (field: HTMLElement, value: string) =>
  fireEvent.change(field, { target: { value } });

const SLOW = { timeout: 3000 };

async function requestLink(email: string) {
  render(<NgoForgotPasswordClient />);
  type(screen.getByLabelText(/business email/i), email);
  fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
  return screen.findByText("Link sent", {}, SLOW);
}

describe("NGO forgot password", () => {
  it("confirms a link was sent and offers the demo link for a real account", async () => {
    await requestLink(DEMO_NGO_CREDENTIALS.email);
    expect(screen.getByText(/emails are not sent yet/i)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /open the demo reset link/i })
        .getAttribute("href")
    ).toMatch(/^\/reset-password\/ngo\/[^/]+\/[^/]+$/);
  });

  it("says the same thing for an address that has no account", async () => {
    await requestLink("stranger@nowhere.org");
    // Same headline and body, and no link that would reveal the difference.
    expect(screen.getByText(/belongs to a MomCare NGO account/i)).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: /open the demo reset link/i })
    ).toBeNull();
  });

  it("asks for an email instead of sending nothing", async () => {
    render(<NgoForgotPasswordClient />);
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(
      await screen.findByText("Enter the business email you sign in with.")
    ).toBeTruthy();
  });

  it("names the rate limit after too many requests", async () => {
    for (let i = 0; i < 5; i++) await requestNgoPasswordReset("a@b.org");
    render(<NgoForgotPasswordClient />);
    type(screen.getByLabelText(/business email/i), "a@b.org");
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(
      await screen.findByText(/too many attempts/i, {}, SLOW)
    ).toBeTruthy();
  });

  it("sends the person back to the NGO side of sign-in", async () => {
    await requestLink("x@y.org");
    expect(
      screen
        .getByRole("link", { name: /back to sign in/i })
        .getAttribute("href")
    ).toBe("/login?portal=ngo");
  });
});

describe("NGO reset password", () => {
  async function liveLink() {
    const { previewPath } = await requestNgoPasswordReset(
      DEMO_NGO_CREDENTIALS.email
    );
    const [, , , uid, token] = previewPath!.split("/");
    return { uid, token };
  }

  const fill = (password: string, confirm = password) => {
    type(screen.getByLabelText(/^new password$/i), password);
    type(screen.getByLabelText(/confirm password/i), confirm);
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));
  };

  it("shows the dead-link state at once, without ever showing the form", async () => {
    render(<NgoResetPasswordClient uid="nope" token="nope" />);
    expect(
      await screen.findByText("This link has expired", {}, SLOW)
    ).toBeTruthy();
    expect(screen.queryByLabelText(/^new password$/i)).toBeNull();
    expect(
      screen
        .getByRole("link", { name: /request a new link/i })
        .getAttribute("href")
    ).toBe("/forgot-password/ngo");
  });

  it("catches a mismatch without asking the service", async () => {
    const { uid, token } = await liveLink();
    render(<NgoResetPasswordClient uid={uid} token={token} />);
    await screen.findByLabelText(/^new password$/i, {}, SLOW);
    fill("Longenough1", "Different1");
    expect(await screen.findByText(/passwords don't match/i)).toBeTruthy();
  });

  it("shows the validator's wording for a weak password and keeps the form", async () => {
    const { uid, token } = await liveLink();
    render(<NgoResetPasswordClient uid={uid} token={token} />);
    await screen.findByLabelText(/^new password$/i, {}, SLOW);
    fill("short");
    expect(await screen.findByText(/too short/i, {}, SLOW)).toBeTruthy();
    expect(screen.getByLabelText(/^new password$/i)).toBeTruthy();
  });

  it("changes the password, then the link is dead and the old password stops working", async () => {
    const { uid, token } = await liveLink();
    const view = render(<NgoResetPasswordClient uid={uid} token={token} />);
    await screen.findByLabelText(/^new password$/i, {}, SLOW);
    fill("BrandNewPass9");

    expect(await screen.findByText("Password changed", {}, SLOW)).toBeTruthy();
    expect(
      within(view.container)
        .getByRole("link", { name: /go to sign in/i })
        .getAttribute("href")
    ).toBe("/login?portal=ngo");

    // The new password signs in; the old one no longer does.
    await expect(
      signInNgo(DEMO_NGO_CREDENTIALS.email, "BrandNewPass9")
    ).resolves.toBeTruthy();
    await expect(
      signInNgo(DEMO_NGO_CREDENTIALS.email, DEMO_NGO_CREDENTIALS.password)
    ).rejects.toThrow(/invalid/i);

    // The link works once.
    cleanup();
    render(<NgoResetPasswordClient uid={uid} token={token} />);
    expect(
      await screen.findByText("This link has expired", {}, SLOW)
    ).toBeTruthy();
  });
});
