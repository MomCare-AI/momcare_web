import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "./useAuth";

describe("useAuth", () => {
  it("returns no user and not loading, with no backend to check yet", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
