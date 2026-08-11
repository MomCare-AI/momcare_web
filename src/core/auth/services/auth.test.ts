import { describe, expect, it } from "vitest";
import { authService } from "./auth";

describe("authService.login", () => {
  it("resolves with the matching user and a token for correct credentials", async () => {
    const result = await authService.login({
      email: "doctor@momcare.com",
      password: "test123",
    });

    expect(result.user).toEqual({
      id: "1",
      name: "Dr. Ayesha",
      email: "doctor@momcare.com",
      role: "doctor",
    });
    expect(result.token).toBe("mock-jwt-token-doctor");
  });

  it("rejects for a wrong password", async () => {
    await expect(
      authService.login({ email: "doctor@momcare.com", password: "wrong" })
    ).rejects.toThrow("Invalid email or password");
  });

  it("rejects for an unknown email", async () => {
    await expect(
      authService.login({ email: "nobody@momcare.com", password: "test123" })
    ).rejects.toThrow("Invalid email or password");
  });
});

describe("authService.register", () => {
  it("resolves with a new user built from the submitted name and email", async () => {
    const result = await authService.register({
      name: "New Doctor",
      email: "new@momcare.com",
      password: "anything",
    });

    expect(result.user).toEqual({
      id: "99",
      name: "New Doctor",
      email: "new@momcare.com",
      role: "doctor",
    });
    expect(result.token).toBe("mock-jwt-token-doctor");
  });
});
