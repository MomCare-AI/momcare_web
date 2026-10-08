import { describe, expect, it } from "vitest";

import {
  checkAddressLine,
  checkCnic,
  checkDateOfBirth,
  checkEmail,
  checkOrgName,
  checkPersonName,
  checkPhone,
  checkPlace,
  checkPostalCode,
  checkWholeNumber,
  keepCnic,
  keepName,
  keepPhone,
} from "./validation";

describe("person names", () => {
  it("rejects digits, which is how 123 got through", () => {
    expect(checkPersonName("123", "First name")).toMatch(/numbers/);
    expect(checkPersonName("Ayesha2", "First name")).toMatch(/numbers/);
  });

  it("rejects empty, one letter and symbols", () => {
    expect(checkPersonName("", "First name")).toMatch(/required/);
    expect(checkPersonName("A", "First name")).toMatch(/at least 2/);
    expect(checkPersonName("@@@", "First name")).not.toBeNull();
    expect(checkPersonName("Ali<script>", "First name")).not.toBeNull();
  });

  it("accepts real names", () => {
    for (const name of [
      "Ayesha",
      "Ayesha Khan",
      "Anne-Marie",
      "O'Brien",
      "Dr. Sana",
      "Zoë",
      "فاطمہ",
    ]) {
      expect(checkPersonName(name, "Name")).toBeNull();
    }
  });

  it("allows an empty optional name", () => {
    expect(checkPersonName("", "Last name", { required: false })).toBeNull();
  });

  it("filters digits and symbols out while typing", () => {
    expect(keepName("Ay3sha#")).toBe("Aysha");
    expect(keepName("123")).toBe("");
    expect(keepName("O'Brien-Smith")).toBe("O'Brien-Smith");
  });
});

describe("places", () => {
  it("rejects digits", () => {
    expect(checkPlace("Lahore1", "City")).toMatch(/numbers/);
    expect(checkPlace("Lahore", "City")).toBeNull();
  });
});

describe("phone numbers", () => {
  it("accepts common shapes", () => {
    expect(checkPhone("03001234567")).toBeNull();
    expect(checkPhone("+92 300 1234567")).toBeNull();
    expect(checkPhone("0300-1234567")).toBeNull();
  });

  it("rejects letters, too few or too many digits, repeats", () => {
    expect(checkPhone("abcdefghij")).not.toBeNull();
    expect(checkPhone("12345")).toMatch(/7 to 15/);
    expect(checkPhone("1234567890123456")).toMatch(/7 to 15/);
    expect(checkPhone("0000000000")).toMatch(/real/);
    expect(checkPhone("03+0012345")).toMatch(/start/);
  });

  it("is optional unless asked", () => {
    expect(checkPhone("")).toBeNull();
    expect(checkPhone("", "Phone", { required: true })).toMatch(/required/);
  });

  it("filters letters while typing", () => {
    expect(keepPhone("03a00-12b")).toBe("0300-12");
  });
});

describe("email", () => {
  it("accepts and rejects", () => {
    expect(checkEmail("a@hospital.com")).toBeNull();
    expect(checkEmail("a@b")).not.toBeNull();
    expect(checkEmail("not an email")).not.toBeNull();
    expect(checkEmail("")).toMatch(/required/);
  });
});

describe("CNIC", () => {
  it("needs 13 digits", () => {
    expect(checkCnic("61101-1234567-8")).toBeNull();
    expect(checkCnic("6110112345678")).toBeNull();
    expect(checkCnic("12345")).not.toBeNull();
    expect(checkCnic("")).toBeNull();
  });

  it("filters letters while typing", () => {
    expect(keepCnic("6110a1-1234567-8")).toBe("61101-1234567-8");
  });
});

describe("organisation, address and postal code", () => {
  it("organisation names allow digits but need letters", () => {
    expect(checkOrgName("Aga Khan Hospital 2")).toBeNull();
    expect(checkOrgName("12345")).toMatch(/letters/);
    expect(checkOrgName("<b>Hospital</b>")).not.toBeNull();
  });

  it("address lines", () => {
    expect(checkAddressLine("House 12, Street 4")).toBeNull();
    expect(checkAddressLine("##")).not.toBeNull();
    expect(checkAddressLine("ab")).toMatch(/short/);
  });

  it("postal codes", () => {
    expect(checkPostalCode("54000")).toBeNull();
    expect(checkPostalCode("!!")).not.toBeNull();
  });
});

describe("numbers and dates", () => {
  it("whole numbers in range", () => {
    expect(checkWholeNumber("3", "Gravida", 1, 20)).toBeNull();
    expect(checkWholeNumber("0", "Gravida", 1, 20)).toMatch(/between/);
    expect(checkWholeNumber("2.5", "Gravida", 1, 20)).toMatch(/whole/);
  });

  it("date of birth is not in the future", () => {
    expect(checkDateOfBirth("2999-01-01")).toMatch(/future/);
    expect(checkDateOfBirth("1996-03-14")).toBeNull();
    expect(checkDateOfBirth("1800-01-01")).toMatch(/120/);
  });
});
