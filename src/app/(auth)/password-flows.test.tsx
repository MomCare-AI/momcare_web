/**
 * The two password screens a signed-out person can reach.
 *
 * The reset test exists because of a bug that had already shipped past a
 * typecheck and a lint: DRF wraps a serializer's message in a list, so
 * `{"detail": ["This reset link is not valid."]}` arrives as an array. React
 * renders an array as text, so the message appeared on screen and looked
 * correct — while the code checking its shape took the wrong branch and left
 * the form sitting there inviting another attempt at a dead link.
 */

import { Suspense } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ForgotPasswordPage from "./forgot-password/page";
import ResetPasswordPage from "./reset-password/[uid]/[token]/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function respond(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

function type(field: HTMLElement, value: string) {
  fireEvent.change(field, { target: { value } });
}

const params = Promise.resolve({ uid: "abc", token: "def" });

/** The page reads its route params with `use()`, which suspends until the
 *  promise settles. Next.js supplies a boundary in the real app; a bare
 *  render() has none, and the component would mount as an empty tree. */
async function renderReset() {
  // Awaited inside act so the suspension actually resolves. Without it React
  // never gets the chance to re-render, and every query runs against an empty
  // tree - which reads exactly like the component being broken.
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <ResetPasswordPage params={params} />
      </Suspense>
    );
  });
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("forgot password", () => {
  it("confirms a link was sent", async () => {
    vi.stubGlobal(
      "fetch",
      respond(200, { detail: "If that address belongs…" })
    );
    render(<ForgotPasswordPage />);

    type(screen.getByLabelText(/email address/i), "someone@hospital.pk");
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/link sent/i)).toBeTruthy();
  });

  it("says the same thing for an address that has no account", async () => {
    // The server refuses to distinguish the two, and so must this screen —
    // otherwise it reveals who works at which hospital, without signing in.
    vi.stubGlobal(
      "fetch",
      respond(200, { detail: "If that address belongs…" })
    );
    render(<ForgotPasswordPage />);

    type(screen.getByLabelText(/email address/i), "nobody@nowhere.invalid");
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/link sent/i)).toBeTruthy();
  });

  it("names the rate limit rather than failing vaguely", async () => {
    vi.stubGlobal("fetch", respond(429, { detail: "throttled" }));
    render(<ForgotPasswordPage />);

    type(screen.getByLabelText(/email address/i), "someone@hospital.pk");
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/too many attempts/i)).toBeTruthy();
  });
});

describe("reset password", () => {
  it("replaces the form when the link is dead", async () => {
    // The regression. `detail` arrives as a list, and the dead-link branch has
    // to survive that — a form left on screen invites another attempt at a
    // link that can never work again.
    vi.stubGlobal(
      "fetch",
      respond(400, {
        detail: ["This reset link is not valid. Request a new one."],
      })
    );
    await renderReset();

    const password = await screen.findByLabelText(/new password/i);
    type(password, "A-Strong-One!2026");
    type(screen.getByLabelText(/confirm password/i), "A-Strong-One!2026");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    expect(await screen.findByText(/this link has expired/i)).toBeTruthy();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /set password/i })).toBeNull()
    );
    expect(
      screen.getByRole("link", { name: /request a new link/i })
    ).toBeTruthy();
  });

  it("shows the server's own wording for a weak password, and keeps the form", async () => {
    vi.stubGlobal(
      "fetch",
      respond(400, { new_password: ["This password is too common."] })
    );
    await renderReset();

    const password = await screen.findByLabelText(/new password/i);
    type(password, "password");
    type(screen.getByLabelText(/confirm password/i), "password");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    expect(await screen.findByText(/too common/i)).toBeTruthy();
    // Still correctable, so the form stays.
    expect(screen.getByRole("button", { name: /set password/i })).toBeTruthy();
  });

  it("catches a mismatch without asking the server", async () => {
    const fetchMock = respond(200, {});
    vi.stubGlobal("fetch", fetchMock);
    await renderReset();

    const password = await screen.findByLabelText(/new password/i);
    type(password, "A-Strong-One!2026");
    type(screen.getByLabelText(/confirm password/i), "Something-Else!2026");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    expect(await screen.findByText(/don't match/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirms success and points at sign-in", async () => {
    vi.stubGlobal(
      "fetch",
      respond(200, { detail: "Your password has been set." })
    );
    await renderReset();

    const password = await screen.findByLabelText(/new password/i);
    type(password, "A-Strong-One!2026");
    type(screen.getByLabelText(/confirm password/i), "A-Strong-One!2026");
    fireEvent.click(screen.getByRole("button", { name: /set password/i }));

    expect(await screen.findByText(/password changed/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /go to sign in/i })).toBeTruthy();
  });
});
