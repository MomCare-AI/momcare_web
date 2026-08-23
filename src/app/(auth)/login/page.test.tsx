/**
 * The autofill desync.
 *
 * A password manager fills a form by writing straight to the DOM. React does
 * not see that, so a controlled input's state stays empty while the box on
 * screen plainly shows an email and a password. Submitting sent two empty
 * strings, and the server answered "Invalid credentials." — telling someone
 * their own saved password is wrong.
 *
 * These tests simulate it the way it actually happens: set the DOM value
 * without dispatching the events React listens for.
 */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/core/api/authFetch", () => ({ setAccessToken: vi.fn() }));
vi.mock("@/core/query/queryClient", () => ({ clearQueryCache: vi.fn() }));

/** Write to the field the way a password manager does — no React event. */
function autofill(field: HTMLElement, value: string) {
  Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!.call(field, value);
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
}

beforeEach(() => {
  push.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access: "token" }),
    })
  );
});

// vitest runs without globals, so RTL's automatic cleanup never registers
// and each render would stack another form onto the same document.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("login form", () => {
  it("sends credentials the browser filled in without telling React", async () => {
    render(<LoginPage />);

    autofill(screen.getByLabelText(/email address/i), "doctor@hospital.pk");
    autofill(screen.getByLabelText(/^password$/i), "correct-horse");

    submit();

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const body = JSON.parse(
      (fetch as never as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body).toEqual({
      email: "doctor@hospital.pk",
      password: "correct-horse",
    });
  });

  it("still sends what the user typed", async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "typed@hospital.pk" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "typed-password" },
    });

    submit();

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const body = JSON.parse(
      (fetch as never as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    );
    expect(body.email).toBe("typed@hospital.pk");
    expect(body.password).toBe("typed-password");
  });

  it("asks for the missing field instead of calling the server", async () => {
    render(<LoginPage />);

    autofill(screen.getByLabelText(/email address/i), "doctor@hospital.pk");
    submit();

    expect(
      await screen.findByText(/enter your email and password/i)
    ).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("labels the fields so a password manager files them correctly", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email address/i)).toHaveProperty(
      "autocomplete",
      "username"
    );
    expect(screen.getByLabelText(/^password$/i)).toHaveProperty(
      "autocomplete",
      "current-password"
    );
  });
});
