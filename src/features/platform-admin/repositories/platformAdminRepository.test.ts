import { beforeEach, describe, expect, it } from "vitest";

import { platformAdminRepository as repo } from "./platformAdminRepository";

const ALL = { type: "all", group: "all", search: "" } as const;

beforeEach(() => repo.resetForTests());

describe("applications inbox", () => {
  it("lists hospitals and NGOs together, newest first", async () => {
    const rows = await repo.listApplications(ALL);
    expect(new Set(rows.map((r) => r.type))).toEqual(
      new Set(["hospital", "ngo"])
    );
    const times = rows.map((r) => Date.parse(r.submittedAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("filters by type, status group and search", async () => {
    const hospitals = await repo.listApplications({ ...ALL, type: "hospital" });
    expect(hospitals.every((r) => r.type === "hospital")).toBe(true);

    const pending = await repo.listApplications({ ...ALL, group: "pending" });
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((r) => r.group === "pending")).toBe(true);

    const found = await repo.listApplications({ ...ALL, search: "noor" });
    expect(found.map((r) => r.name)).toContain("Noor Mother & Child Hospital");
    const byLicence = await repo.listApplications({
      ...ALL,
      search: "swd-rwp",
    });
    expect(byLicence.map((r) => r.name)).toContain("Care Foundation");
  });

  it("counts an NGO under review as pending, and verified as approved", async () => {
    const rows = await repo.listApplications({ ...ALL, type: "ngo" });
    const byName = Object.fromEntries(rows.map((r) => [r.name, r]));
    expect(byName["Hope Mothers Trust"].group).toBe("pending");
    expect(byName["Hope Mothers Trust"].statusLabel).toBe("Under review");
    expect(byName["Sehat Welfare Society"].group).toBe("approved");
    expect(byName["Sehat Welfare Society"].statusLabel).toBe(
      "Verified by MomCare"
    );
  });
});

describe("hospital decisions", () => {
  it("approves a pending hospital and records who and why", async () => {
    const h = await repo.decideHospital(
      "h1",
      "approve",
      "Checked register",
      "Sam"
    );
    expect(h.status).toBe("approved");
    expect(h.reviewedBy).toBe("Sam");
    expect(h.reviewedAt).toBeTruthy();
    expect(h.reviewNote).toBe("Checked register");
    expect((await repo.listActivity())[0]).toMatchObject({
      by: "Sam",
      action: "approved",
      orgName: "Noor Mother & Child Hospital",
    });
  });

  it("requires a reason to reject or suspend, but not to approve", async () => {
    await expect(
      repo.decideHospital("h2", "reject", "  ", "Sam")
    ).rejects.toThrow(/reason/i);
    await expect(
      repo.decideHospital("h3", "suspend", "", "Sam")
    ).rejects.toThrow(/reason/i);
    await expect(
      repo.decideHospital("h2", "approve", "", "Sam")
    ).resolves.toMatchObject({ status: "approved" });
  });

  it("follows the transition table", async () => {
    // pending cannot be suspended; approved cannot be approved again;
    // rejected is final (the applicant must reapply).
    await expect(
      repo.decideHospital("h1", "suspend", "x", "Sam")
    ).rejects.toThrow();
    await expect(
      repo.decideHospital("h3", "approve", "", "Sam")
    ).rejects.toThrow();
    await expect(
      repo.decideHospital("h4", "approve", "", "Sam")
    ).rejects.toThrow();

    const suspended = await repo.decideHospital(
      "h3",
      "suspend",
      "Licence lapsed",
      "Sam"
    );
    expect(suspended.status).toBe("suspended");
    const back = await repo.decideHospital("h3", "reactivate", "", "Sam");
    expect(back.status).toBe("approved");
  });

  it("replaces the review note instead of keeping a stale one", async () => {
    await repo.decideHospital("h3", "suspend", "First reason", "Sam");
    const back = await repo.decideHospital("h3", "reactivate", "", "Sam");
    expect(back.reviewNote).toBe("");
  });
});

describe("NGO decisions", () => {
  it("only starts a review from pending", async () => {
    const started = await repo.decideNgo(
      "ngo-seed-1",
      "start_review",
      "",
      "Sam"
    );
    expect(started.status).toBe("under_review");
    await expect(
      repo.decideNgo("ngo-seed-1", "start_review", "", "Sam")
    ).rejects.toThrow();
  });

  it("checks documents only during review, and a rejection needs a reason", async () => {
    await expect(
      repo.decideNgoDocument("ngo-seed-3", "d1", "verified", "", "Sam")
    ).rejects.toThrow(/start the review/i);

    await expect(
      repo.decideNgoDocument("ngo-seed-2", "d3", "rejected", " ", "Sam")
    ).rejects.toThrow(/reason/i);
    const ngo = await repo.decideNgoDocument(
      "ngo-seed-2",
      "d3",
      "rejected",
      "Illegible scan",
      "Sam"
    );
    expect(ngo.documents.find((d) => d.id === "d3")).toMatchObject({
      status: "rejected",
      rejectionReason: "Illegible scan",
    });
  });

  it("will not verify an NGO until both required documents are verified", async () => {
    // Hope Mothers Trust: certificate verified, authorization letter pending.
    await expect(
      repo.decideNgo("ngo-seed-2", "approve", "", "Sam")
    ).rejects.toThrow(/verify the registration certificate/i);

    await repo.decideNgoDocument("ngo-seed-2", "d2", "verified", "", "Sam");
    const approved = await repo.decideNgo("ngo-seed-2", "approve", "", "Sam");
    expect(approved.status).toBe("verified");
  });

  it("requires a reason to reject or suspend", async () => {
    await expect(
      repo.decideNgo("ngo-seed-3", "suspend", "", "Sam")
    ).rejects.toThrow(/reason/i);
    const s = await repo.decideNgo(
      "ngo-seed-3",
      "suspend",
      "Paperwork expired",
      "Sam"
    );
    expect(s).toMatchObject({
      status: "suspended",
      statusReason: "Paperwork expired",
    });
    const r = await repo.decideNgo("ngo-seed-3", "reactivate", "", "Sam");
    expect(r).toMatchObject({ status: "verified", statusReason: null });
  });

  it("records a request for more information", async () => {
    await expect(
      repo.requestNgoInfo("ngo-seed-1", "  ", "Sam")
    ).rejects.toThrow(/what information/i);
    const ngo = await repo.requestNgoInfo(
      "ngo-seed-1",
      "Please upload the renewal certificate.",
      "Sam"
    );
    expect(ngo.infoRequests.at(-1)?.message).toMatch(/renewal certificate/);
    await expect(repo.requestNgoInfo("ngo-seed-3", "x", "Sam")).rejects.toThrow(
      /during review/i
    );
  });
});

describe("overview and directory", () => {
  it("summarises the platform and lists only reviewed-and-live organizations", async () => {
    const o = await repo.getOverview();
    expect(o.pending).toBeGreaterThan(0);
    expect(o.recentApplications.length).toBeLessThanOrEqual(5);

    const orgs = await repo.listOrganizations();
    expect(
      orgs.every((r) => r.group === "approved" || r.group === "suspended")
    ).toBe(true);
  });
});

describe("link with NGO registration", () => {
  it("shows an NGO submitted through the registration wizard as pending", async () => {
    const { submitNgoApplication } =
      await import("@/features/ngo-onboarding/api/registerNgo");
    const pdf = (name: string) =>
      new File(["%PDF-1.4"], name, { type: "application/pdf" });
    await submitNgoApplication(
      {
        orgName: "Wizard Submitted NGO",
        orgEmail: "info@wizard-ngo.example",
        orgPhone: "+92 300 1234567",
        website: "",
        province: "Punjab",
        district: "Lahore",
        address: "12 Canal Road, Lahore",
        areasOfOperation: ["Punjab"],
        authority: "Social Welfare Department",
        registrationType: "Voluntary Social Welfare Agency",
        registrationNumber: "SWD-9999",
        registrationDate: "2020-01-15",
        expiryDate: "",
        ntn: "",
        repName: "Test Person",
        cnic: "35202-1234567-1",
        designation: "Director",
        repEmail: "test@wizard-ngo.example",
        repPhone: "03001234567",
      },
      [
        { id: "a", type: "registration_certificate", file: pdf("a.pdf") },
        { id: "b", type: "authorization_letter", file: pdf("b.pdf") },
      ]
    );

    const rows = await repo.listApplications({
      ...ALL,
      search: "wizard submitted",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: "ngo",
      group: "pending",
      statusLabel: "Pending",
    });
  });
});
