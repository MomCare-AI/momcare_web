import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import PlatformAdminLayout from "./layout";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/platform",
}));

const useCurrentUser = vi.fn();
vi.mock("@/features/portal/hooks/usePortalData", () => ({
  useCurrentUser: () => useCurrentUser(),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  replace.mockClear();
  useCurrentUser.mockReset();
});

function renderLayout() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <PlatformAdminLayout>
        <p>console page</p>
      </PlatformAdminLayout>
    </QueryClientProvider>
  );
}

describe("platform admin layout", () => {
  it("shows a skeleton, not the page, while the role is being checked", () => {
    useCurrentUser.mockReturnValue({ isPending: true, data: undefined });
    renderLayout();
    expect(screen.queryByText("console page")).toBeNull();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("sends a hospital user back to their own portal", () => {
    useCurrentUser.mockReturnValue({
      isPending: false,
      data: {
        role_code: "hospital_admin",
        first_name: "A",
        last_name: "B",
        email: "a@b",
      },
    });
    renderLayout();
    expect(replace).toHaveBeenCalledWith("/dashboard");
    expect(screen.queryByText("console page")).toBeNull();
  });

  it("renders the console for a platform admin", () => {
    useCurrentUser.mockReturnValue({
      isPending: false,
      data: {
        role_code: "platform_admin",
        first_name: "Sam",
        last_name: "Admin",
        email: "sam@momcare.example",
      },
    });
    renderLayout();
    expect(screen.getByText("console page")).toBeTruthy();
    expect(screen.getAllByText(/Sam Admin/).length).toBeGreaterThan(0);
  });

  it("preview mode skips the login check, in development only", () => {
    useCurrentUser.mockReturnValue({ isPending: false, data: undefined });
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_PLATFORM_PREVIEW", "1");
    renderLayout();
    expect(screen.getByText("console page")).toBeTruthy();
    expect(screen.getAllByText(/Local preview/).length).toBeGreaterThan(0);
    expect(replace).not.toHaveBeenCalled();
  });

  it("ignores the preview variable outside development", () => {
    useCurrentUser.mockReturnValue({ isPending: true, data: undefined });
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_PLATFORM_PREVIEW", "1");
    renderLayout();
    // Still the real guard: no page content while the role is unchecked.
    expect(screen.queryByText("console page")).toBeNull();
  });
});
