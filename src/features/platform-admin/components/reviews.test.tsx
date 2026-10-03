import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HospitalReview } from "./HospitalReview";
import { NgoReview } from "./NgoReview";

vi.mock("@/features/portal/hooks/usePortalData", () => ({
  useCurrentUser: () => ({ data: { first_name: "Sam", last_name: "Admin" } }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

afterEach(cleanup);

function renderWith(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

const SLOW = { timeout: 3000 };

describe("hospital review", () => {
  it("approves a pending hospital and shows who decided", async () => {
    renderWith(<HospitalReview id="h1" />);
    await screen.findByRole("heading", { name: /noor mother/i }, SLOW);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: /approve hospital/i })
    );

    expect(await screen.findByText(/by Sam Admin/, {}, SLOW)).toBeTruthy();
    // And a plain confirmation that it went through.
    expect(
      screen.getByText("Noor Mother & Child Hospital approved.")
    ).toBeTruthy();
    // Approved hospitals can now only be suspended.
    expect(screen.getByRole("button", { name: "Suspend" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });

  it("will not reject without a reason", async () => {
    renderWith(<HospitalReview id="h2" />);
    await screen.findByRole("heading", { name: /green valley/i }, SLOW);

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", {
      name: /reject application/i,
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    fireEvent.change(within(dialog).getByLabelText(/reason/i), {
      target: { value: "Licence not found in the register" },
    });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);

    // The page refreshes after the decision: wait for it, then check the
    // stored reason is shown (matched as "Note: ..." so it cannot be confused
    // with the text still sitting in the closing dialog's box).
    expect(
      await screen.findByText(/No further decisions are possible/i, {}, SLOW)
    ).toBeTruthy();
    expect(
      screen.getByText(/Note: Licence not found in the register/)
    ).toBeTruthy();
  });

  it("says so when the application does not exist", async () => {
    renderWith(<HospitalReview id="nope" />);
    expect(
      await screen.findByText("Application not found", {}, SLOW)
    ).toBeTruthy();
  });
});

describe("NGO review", () => {
  it("cannot verify an NGO until the required documents are verified", async () => {
    renderWith(<NgoReview id="ngo-seed-2" />);
    await screen.findByRole("heading", { name: /hope mothers trust/i }, SLOW);

    const verifyNgo = screen.getByRole("button", {
      name: "Verify NGO",
    }) as HTMLButtonElement;
    expect(verifyNgo.disabled).toBe(true);

    // The authorization letter is the one required document still pending.
    const row = screen
      .getByText("Authorization Letter")
      .closest(".mc-row") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Verify" }));

    await waitFor(() => expect(verifyNgo.disabled).toBe(false), SLOW);

    fireEvent.click(verifyNgo);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Verify NGO" }));

    expect(
      await screen.findByText(/Verified by MomCare/, {}, SLOW)
    ).toBeTruthy();
  });

  it("hides the CNIC until asked", async () => {
    renderWith(<NgoReview id="ngo-seed-1" />);
    await screen.findByRole("heading", { name: /care foundation/i }, SLOW);

    expect(screen.queryByText("37405-1234567-2")).toBeNull();
    expect(screen.getByText("37405-*******-2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show CNIC" }));
    expect(screen.getByText("37405-1234567-2")).toBeTruthy();
  });

  it("starts a review from pending, then lets documents be checked", async () => {
    renderWith(<NgoReview id="ngo-seed-1" />);
    await screen.findByRole("heading", { name: /care foundation/i }, SLOW);

    // No document buttons before the review starts.
    expect(screen.queryByRole("button", { name: "Verify" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Start review" }));

    expect(
      (await screen.findAllByRole("button", { name: "Verify" }, SLOW)).length
    ).toBeGreaterThan(0);
  });
});
