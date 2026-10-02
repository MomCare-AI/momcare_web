import { describe, expect, it } from "vitest";

import { validateDocumentFile } from "@/shared/registration/documents";
import { DISTRICTS, PROVINCES } from "./data/pakistan";
import {
  formatCnic,
  legalSchema,
  orgInfoSchema,
  representativeSchema,
} from "./schemas";

const legal = {
  authority: "Social Welfare Department",
  registrationType: "Voluntary Social Welfare Agency",
  registrationNumber: "SWD-1234",
  registrationDate: "2020-01-15",
  expiryDate: "",
  ntn: "",
};

describe("NGO registration schemas", () => {
  it("formats a CNIC as XXXXX-XXXXXXX-X while typing", () => {
    expect(formatCnic("3520212345671")).toBe("35202-1234567-1");
    expect(formatCnic("35202")).toBe("35202");
    expect(formatCnic("35202-12ab34")).toBe("35202-1234");
    expect(formatCnic("352021234567199")).toBe("35202-1234567-1");
  });

  it("accepts only a complete CNIC", () => {
    const rep = {
      repName: "Sara Ali",
      designation: "Director",
      repEmail: "sara@ngo.org",
      repPhone: "03001234567",
    };
    expect(
      representativeSchema.safeParse({ ...rep, cnic: "35202-1234567-1" })
        .success
    ).toBe(true);
    expect(
      representativeSchema.safeParse({ ...rep, cnic: "3520212345671" }).success
    ).toBe(false);
  });

  it("rejects an expiry date before the registration date, allows none", () => {
    expect(legalSchema.safeParse(legal).success).toBe(true);
    expect(
      legalSchema.safeParse({ ...legal, expiryDate: "2019-01-01" }).success
    ).toBe(false);
    expect(
      legalSchema.safeParse({ ...legal, expiryDate: "2030-01-01" }).success
    ).toBe(true);
  });

  it("rejects a future registration date and unknown authorities", () => {
    expect(
      legalSchema.safeParse({ ...legal, registrationDate: "2999-01-01" })
        .success
    ).toBe(false);
    expect(
      legalSchema.safeParse({ ...legal, authority: "Made Up Office" }).success
    ).toBe(false);
  });

  it("requires a valid org email, phone, province and an area", () => {
    const org = {
      orgName: "Helping Hands",
      orgEmail: "info@ngo.org",
      orgPhone: "+92 300 1234567",
      website: "",
      province: "Punjab",
      district: "Lahore",
      address: "12 Canal Road, Lahore",
      areasOfOperation: ["Punjab"],
    };
    expect(orgInfoSchema.safeParse(org).success).toBe(true);
    expect(orgInfoSchema.safeParse({ ...org, orgEmail: "nope" }).success).toBe(
      false
    );
    expect(orgInfoSchema.safeParse({ ...org, orgPhone: "12" }).success).toBe(
      false
    );
    expect(
      orgInfoSchema.safeParse({ ...org, areasOfOperation: [] }).success
    ).toBe(false);
    expect(
      orgInfoSchema.safeParse({ ...org, website: "not a url" }).success
    ).toBe(false);
  });

  it("has districts for every province, with no duplicates inside one", () => {
    for (const p of PROVINCES) {
      expect(DISTRICTS[p].length).toBeGreaterThan(0);
      expect(new Set(DISTRICTS[p]).size).toBe(DISTRICTS[p].length);
    }
  });
});

describe("document validation", () => {
  const file = (name: string, type: string, size = 100) =>
    new File([new Uint8Array(size)], name, { type });

  it("accepts PDF, JPG and PNG within the size limit", () => {
    expect(validateDocumentFile(file("a.pdf", "application/pdf"))).toBeNull();
    expect(validateDocumentFile(file("a.jpg", "image/jpeg"))).toBeNull();
    expect(validateDocumentFile(file("a.png", "image/png"))).toBeNull();
  });

  it("rejects other types, empty files and oversized files", () => {
    expect(
      validateDocumentFile(file("a.exe", "application/x-msdownload"))
    ).toMatch(/pdf, jpg or png/i);
    expect(validateDocumentFile(file("a.pdf", "text/html"))).toMatch(
      /pdf, jpg or png/i
    );
    expect(validateDocumentFile(file("a.pdf", "application/pdf", 0))).toMatch(
      /empty/i
    );
    expect(
      validateDocumentFile(file("a.pdf", "application/pdf", 6 * 1024 * 1024))
    ).toMatch(/too large/i);
  });
});
