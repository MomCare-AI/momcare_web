import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { listNgoApplications } from "../api/registerNgo";
import NgoWizard from "./NgoWizard";

afterEach(cleanup);

const byLabel = (re: RegExp) => screen.getByLabelText(re);
const set = (re: RegExp, value: string) =>
  fireEvent.change(byLabel(re), { target: { value } });
const next = () =>
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));

const pdf = (name: string) =>
  new File(["%PDF-1.4 test"], name, { type: "application/pdf" });

/** The counter updates at once but the form fades in after; wait for the form. */
const onStep = async (n: number, firstField: RegExp) => {
  expect(await screen.findByText(`Step ${n} of 4`)).toBeTruthy();
  await screen.findByLabelText(firstField);
};

function fillStep1() {
  set(/organization name/i, "Helping Hands Foundation");
  set(/official email/i, "info@helpinghands.org");
  set(/official phone/i, "+92 300 1234567");
  set(/province/i, "Punjab");
  set(/district/i, "Lahore");
  set(/official address/i, "12 Canal Road, Lahore");
  fireEvent.click(screen.getByRole("button", { name: "Punjab" }));
}

function fillStep2() {
  set(/registration authority/i, "Social Welfare Department");
  set(/registration type/i, "Voluntary Social Welfare Agency");
  set(/registration number/i, "SWD-1234");
  set(/registration date/i, "2020-01-15");
}

function fillStep3(container: HTMLElement) {
  set(/full name/i, "Sara Ali");
  set(/cnic/i, "3520212345671");
  set(/designation/i, "Director");
  fireEvent.change(document.getElementById("repEmail")!, {
    target: { value: "sara@helpinghands.org" },
  });
  set(/phone number/i, "03001234567");
  const inputs =
    container.querySelectorAll<HTMLInputElement>("input[type=file]");
  fireEvent.change(inputs[0], { target: { files: [pdf("registration.pdf")] } });
  fireEvent.change(inputs[1], {
    target: { files: [pdf("authorization.pdf")] },
  });
}

describe("NgoWizard", () => {
  it("uses the shared registration shell: four steps and a counter", () => {
    render(<NgoWizard />);
    for (const label of [
      "Organization",
      "Registration",
      "Representative",
      "Review",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText("Step 1 of 4")).toBeTruthy();
  });

  it("blocks step 1 until required fields validate", async () => {
    render(<NgoWizard />);
    next();
    expect(
      await screen.findByText("Organization name is required")
    ).toBeTruthy();
    expect(screen.getByText("Step 1 of 4")).toBeTruthy();
  });

  it("makes the district depend on the province", async () => {
    render(<NgoWizard />);
    const district = byLabel(/district/i) as HTMLSelectElement;
    expect(district.disabled).toBe(true);

    set(/province/i, "Islamabad Capital Territory");
    await waitFor(() => expect(district.disabled).toBe(false));
    expect(Array.from(district.options).map((o) => o.value)).toContain(
      "Islamabad"
    );
  });

  it("walks all four steps, requires documents and consent, then submits", async () => {
    const { container } = render(<NgoWizard />);

    fillStep1();
    next();
    await onStep(2, /registration authority/i);

    fillStep2();
    next();
    await onStep(3, /full name/i);

    // Representative filled but no documents yet: cannot continue.
    set(/full name/i, "Sara Ali");
    set(/cnic/i, "3520212345671");
    set(/designation/i, "Director");
    fireEvent.change(document.getElementById("repEmail")!, {
      target: { value: "sara@helpinghands.org" },
    });
    set(/phone number/i, "03001234567");
    next();
    expect(
      await screen.findByText("Registration Certificate is required")
    ).toBeTruthy();
    expect(screen.getByText("Step 3 of 4")).toBeTruthy();

    fillStep3(container);
    next();
    expect(await screen.findByText("Step 4 of 4")).toBeTruthy();
    await screen.findByText("Check everything before you submit");

    // Review shows what was entered, with the formatted CNIC and file names.
    expect(screen.getByText("Helping Hands Foundation")).toBeTruthy();
    expect(screen.getByText("35202-1234567-1")).toBeTruthy();
    expect(screen.getByText(/registration\.pdf/)).toBeTruthy();

    // No consent, no submit.
    fireEvent.click(
      screen.getByRole("button", { name: /submit registration/i })
    );
    expect(
      await screen.findByText("Please confirm before submitting.")
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: /submit registration/i })
    );
    expect(
      await screen.findByText("Application submitted", {}, { timeout: 3000 })
    ).toBeTruthy();

    // Stored as PENDING, with documents recorded by name only.
    const [app] = await listNgoApplications();
    expect(app.status).toBe("pending");
    expect(app.documents).toHaveLength(2);
    expect(app.documents.every((d) => d.status === "pending")).toBe(true);
  });

  it("lets the reviewer go back to edit a section", async () => {
    const { container } = render(<NgoWizard />);
    fillStep1();
    next();
    await onStep(2, /registration authority/i);
    fillStep2();
    next();
    await onStep(3, /full name/i);
    fillStep3(container);
    next();
    await screen.findByText("Check everything before you submit");

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    await onStep(1, /organization name/i);
    expect((byLabel(/organization name/i) as HTMLInputElement).value).toBe(
      "Helping Hands Foundation"
    );
  });
});
