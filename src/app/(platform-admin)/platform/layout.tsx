"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  clearAccessToken,
  logout,
  SessionExpiredError,
} from "@/core/api/authFetch";
import { clearQueryCache } from "@/core/query/queryClient";
import { useCurrentUser } from "@/features/portal/hooks/usePortalData";
import "../../portal.css";

/**
 * The platform-admin shell — deliberately separate from the hospital
 * portal's `(portal)/dashboard/layout.tsx`, which fetches `/api/organization
 * /me/` unconditionally and would hang on "Loading your hospital…" forever
 * for a platform_admin (`User.organization` is null for this role — see
 * backend CLAUDE.md's Roles section). No Sidebar, no org fetch, no
 * hospital-scoped nav — just the one console this role has today (AI
 * Summary Templates). Reuses `portal.css`'s generic design tokens
 * (`.mc-card`, `.mc-btn`, `.mc-input`...) via the same `.mc-portal` wrapper
 * that defines them, without any of that layout's sidebar/shell markup.
 */
export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const userQuery = useCurrentUser();
  const user = userQuery.data;

  useEffect(() => {
    if (userQuery.error instanceof SessionExpiredError) {
      router.replace("/login?expired=1");
    }
  }, [userQuery.error, router]);

  useEffect(() => {
    // Not this role → not this console. A hospital-side user landing here
    // (bookmark, typo) goes back to their own portal rather than seeing a
    // blank/broken page built for a role they aren't.
    if (user && user.role_code !== "platform_admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const signOut = () => {
    void logout();
    clearAccessToken();
    clearQueryCache();
    router.replace("/login");
  };

  if (userQuery.isPending) {
    return (
      <div className="mc-portal">
        <div className="mc-loading">Loading…</div>
      </div>
    );
  }

  if (!user || user.role_code !== "platform_admin") {
    // Mid-redirect (effect above) or a genuinely failed fetch — either way
    // there's nothing safe to render here.
    return (
      <div className="mc-portal">
        <div className="mc-loading">Loading…</div>
      </div>
    );
  }

  return (
    <div className="mc-portal">
      <div style={{ width: "100%" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 40px",
            borderBottom: "1px solid var(--c-border)",
            background: "var(--c-card)",
          }}
        >
          <div>
            <div
              style={{ fontWeight: 700, fontSize: 15, color: "var(--c-ink)" }}
            >
              MomCare — Platform Admin
            </div>
            <div className="mc-hint">
              {user.first_name} {user.last_name} · {user.email}
            </div>
          </div>
          <button type="button" className="mc-btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </header>
        <div className="mc-page">{children}</div>
      </div>
    </div>
  );
}
