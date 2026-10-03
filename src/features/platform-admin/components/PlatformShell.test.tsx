import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlatformShell } from "./PlatformShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/platform/applications",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

beforeEach(() => localStorage.clear());
afterEach(cleanup);

function renderShell() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PlatformShell
        userLabel="Sam Admin · sam@momcare.example"
        onSignOut={vi.fn()}
      >
        <p>page body</p>
      </PlatformShell>
    </QueryClientProvider>
  );
}

const toggle = () => screen.getByRole("button", { name: /sidebar/i });

describe("Platform Admin shell", () => {
  it("lists the navigation and marks the current page", () => {
    renderShell();
    const nav = screen.getAllByRole("navigation", {
      name: "Platform admin",
    })[0];
    expect(nav.querySelectorAll("a")).toHaveLength(5);
    expect(
      nav.querySelector("a[aria-current='page']")?.getAttribute("href")
    ).toBe("/platform/applications");
    expect(screen.getByText("page body")).toBeTruthy();
  });

  it("collapses to a rail, keeps labels for screen readers, and remembers it", () => {
    renderShell();
    expect(toggle().getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(toggle());
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(toggle().getAttribute("aria-label")).toBe("Expand sidebar");
    expect(localStorage.getItem("momcare_platform_sidebar_collapsed")).toBe(
      "1"
    );
    // Collapsed items are still named, and get a tooltip.
    const nav = screen.getAllByRole("navigation", {
      name: "Platform admin",
    })[0];
    expect(nav.querySelector("a[aria-label='Overview']")).toBeTruthy();
    expect(nav.querySelectorAll("[role='tooltip']").length).toBe(5);

    fireEvent.click(toggle());
    expect(localStorage.getItem("momcare_platform_sidebar_collapsed")).toBe(
      "0"
    );
  });

  it("starts collapsed when that was the saved choice", () => {
    localStorage.setItem("momcare_platform_sidebar_collapsed", "1");
    renderShell();
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("toggles with Ctrl+B", () => {
    renderShell();
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
  });

  it("opens the mobile drawer, locks scroll, and closes on Escape", () => {
    renderShell();
    const drawer = screen.getByRole("dialog", { name: "Navigation menu" });
    expect(drawer.parentElement?.hasAttribute("inert")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(drawer.parentElement?.hasAttribute("inert")).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(drawer.parentElement?.hasAttribute("inert")).toBe(true);
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});
