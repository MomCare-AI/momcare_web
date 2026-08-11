import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAuth } from "./useAuth";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("useAuth", () => {
  beforeEach(() => {
    push.mockClear();
    localStorage.clear();
  });

  it("starts with no user, not loading, no error", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("logs in and stores the user for valid mock credentials", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({
        email: "doctor@momcare.com",
        password: "test123",
      });
    });

    expect(result.current.user?.email).toBe("doctor@momcare.com");
    expect(result.current.error).toBeNull();
    expect(push).toHaveBeenCalled();
  });

  it("sets an error and no user for invalid credentials", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({
        email: "doctor@momcare.com",
        password: "wrong",
      });
    });

    expect(result.current.error).toBe("Invalid email or password");
    expect(result.current.user).toBeNull();
  });
});
