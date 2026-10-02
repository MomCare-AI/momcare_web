import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import HospitalWizard from "./HospitalWizard";

const type = (placeholder: string, value: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), {
    target: { value },
  });

/**
 * Characterization tests for the hospital wizard's shell behaviour (stepper,
 * counter, navigation, validation gate). They exist so the shell can be
 * extracted into shared registration components without changing the flow.
 */
describe("HospitalWizard shell", () => {
  afterEach(cleanup);

  it("shows the four-step stepper, counter and sign-in footer", () => {
    render(<HospitalWizard />);

    for (const label of ["Account", "Organization", "Contact", "Location"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText("Step 1 of 4")).toBeTruthy();
    expect(screen.getByRole("button", { name: /continue/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
    expect(
      screen.getByRole("link", { name: /sign in to your account/i })
    ).toBeTruthy();
  });

  it("blocks Continue until the step validates", async () => {
    render(<HospitalWizard />);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText("First name is required")).toBeTruthy();
    expect(screen.getByText("Step 1 of 4")).toBeTruthy();
  });

  it("advances after a valid step, and Back keeps what was typed", async () => {
    render(<HospitalWizard />);
    type("John", "Sara");
    type("Smith", "Ali");
    type("owner@yourhospital.com", "sara@hospital.pk");
    type("Min. 8 characters", "Passw0rdOK");
    type("Repeat password", "Passw0rdOK");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText("Step 2 of 4")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));

    await waitFor(() => expect(screen.getByText("Step 1 of 4")).toBeTruthy());
    expect(
      (screen.getByPlaceholderText("John") as HTMLInputElement).value
    ).toBe("Sara");
  });
});
