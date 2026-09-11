/**
 * The sidebar identity rules, confirmed with the user before implementation:
 * "Dr." is a role convention shown for every provider, never a stored
 * per-person title, and never invented for anyone else.
 */

import { describe, expect, it } from "vitest";

import { displayNameFor, roleLabelFor } from "./layout";
import type { CurrentUser } from "./layout";

function user(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: "u1",
    email: "someone@example.com",
    first_name: "Ahmed",
    last_name: "Nawaz",
    role_code: "hospital_admin",
    staff_id: null,
    ...overrides,
  };
}

describe("displayNameFor", () => {
  it("prefixes Dr. for a provider, derived from role_code, never a stored field", () => {
    expect(
      displayNameFor(
        user({ role_code: "provider", first_name: "Sarah", last_name: "Ahmed" })
      )
    ).toBe("Dr. Sarah Ahmed");
  });

  it("never prefixes Dr. for any other role", () => {
    expect(
      displayNameFor(
        user({ role_code: "nurse", first_name: "Ayesha", last_name: "Khan" })
      )
    ).toBe("Ayesha Khan");
    expect(
      displayNameFor(
        user({
          role_code: "care_manager",
          first_name: "Ali",
          last_name: "Raza",
        })
      )
    ).toBe("Ali Raza");
    expect(
      displayNameFor(
        user({
          role_code: "hospital_admin",
          first_name: "Ahmed",
          last_name: "Nawaz",
        })
      )
    ).toBe("Ahmed Nawaz");
  });

  it("falls back to the email when neither name is set, rather than a blank identity", () => {
    expect(
      displayNameFor(
        user({ first_name: "", last_name: "", email: "someone@example.com" })
      )
    ).toBe("someone@example.com");
  });
});

describe("roleLabelFor", () => {
  it("labels every hospital-tier role as agreed", () => {
    expect(roleLabelFor("provider")).toBe("Doctor");
    expect(roleLabelFor("nurse")).toBe("Nurse");
    expect(roleLabelFor("care_manager")).toBe("Care Manager");
    expect(roleLabelFor("hospital_admin")).toBe("Hospital Administrator");
  });

  it("falls back to a readable label for an unmapped role rather than showing raw_snake_case", () => {
    expect(roleLabelFor("platform_admin")).toBe("Platform Administrator");
    expect(roleLabelFor("some_new_role")).toBe("some new role");
  });
});
