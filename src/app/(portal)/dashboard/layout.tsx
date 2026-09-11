"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  Activity,
  BellRing,
  Building2,
  LayoutDashboard,
  Stethoscope,
  Users,
  Watch,
} from "lucide-react";
import {
  clearAccessToken,
  logout,
  SessionExpiredError,
} from "@/core/api/authFetch";
import { clearQueryCache } from "@/core/query/queryClient";
import {
  useCurrentUser,
  useOrganization,
  useRefreshPortal,
  type CurrentUser,
  type OrgSummary,
} from "@/features/portal/hooks/usePortalData";
import { AppHeader } from "./components/AppHeader";
import { MobileSidebarDrawer } from "./components/MobileSidebarDrawer";
import { Sidebar } from "./components/Sidebar";
import type { NavItem } from "./components/SidebarNavItem";
import "../../portal.css";

// Re-exported so pages can keep importing these from the layout they already
// depend on; the shapes themselves live with the queries that fetch them.
export type { CurrentUser, OrgSummary };

interface PortalValue {
  org: OrgSummary;
  user: CurrentUser;
  isHospitalAdmin: boolean;
  /** May make a clinical judgement — acknowledge an alert, review an
   *  assessment. Mirrors the server's IsClinician, which is what actually
   *  enforces it; this only decides what is worth putting on screen. */
  isClinician: boolean;
  refresh: () => Promise<void>;
}

const CLINICAL_ROLES = new Set(["provider", "nurse", "care_manager"]);

/**
 * How a role reads on the sidebar's own identity card. "Dr." is a role
 * convention shown for every provider, not a stored title on any one
 * person's record — provider is this system's doctor role (see
 * core/common/permissions.py's IsClinician), so the prefix is derived,
 * never a per-user hardcode.
 */
const ROLE_LABELS: Record<string, string> = {
  hospital_admin: "Hospital Administrator",
  provider: "Doctor",
  nurse: "Nurse",
  care_manager: "Care Manager",
  platform_admin: "Platform Administrator",
  patient: "Patient",
};

// Exported for tests only — not part of this module's real public surface,
// since nothing outside the sidebar itself has a reason to format identity.
export function displayNameFor(user: CurrentUser): string {
  const name = `${user.first_name} ${user.last_name}`.trim() || user.email;
  return user.role_code === "provider" ? `Dr. ${name}` : name;
}

export function roleLabelFor(roleCode: string): string {
  return ROLE_LABELS[roleCode] ?? roleCode.replace(/_/g, " ");
}

const PortalContext = createContext<PortalValue | null>(null);

/** Portal data, fetched once by the shell rather than by every page. */
export function usePortal(): PortalValue {
  const ctx = useContext(PortalContext);
  if (!ctx)
    throw new Error("usePortal must be used inside the dashboard layout");
  return ctx;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  {
    href: "/dashboard/attention",
    label: "Needs attention",
    Icon: Activity,
    clinicalOnly: true,
  },
  { href: "/dashboard/alerts", label: "Alerts", Icon: BellRing },
  { href: "/dashboard/devices", label: "Devices", Icon: Watch },
  { href: "/dashboard/patients", label: "Patients", Icon: Users },
  { href: "/dashboard/staff", label: "Doctors & Staff", Icon: Stethoscope },
  {
    href: "/dashboard/hospital",
    label: "Hospital",
    Icon: Building2,
    adminOnly: true,
  },
];

const COLLAPSE_STORAGE_KEY = "mc-sidebar-collapsed";
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Which tier applies right now — desktop (>=1024px) or not. A
 * useSyncExternalStore subscription rather than a matchMedia listener
 * wired up in an effect: this is genuinely an external, synchronous store
 * (the browser's own media-query state), which is exactly what the hook
 * exists for, and it sidesteps the "setState synchronously in an effect"
 * problem entirely rather than working around it.
 *
 * Both `change` and `resize` trigger the same re-check. Belt and braces:
 * matchMedia's own event is the correct, precise signal, but a plain
 * `resize` costs nothing extra to also listen for (React's own
 * Object.is comparison on the snapshot throws away any call that didn't
 * actually cross the breakpoint) and closes any environment where the
 * former doesn't fire reliably on a live resize.
 */
function subscribeToDesktopTier(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}
function getIsDesktopTier() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}
// The real sidebar never appears in server-rendered HTML — this layout
// gates all of it behind the org/user data load below, which only ever
// resolves client-side. The server snapshot is never actually shown, so
// its exact value doesn't matter beyond being a valid boolean.
function getIsDesktopTierServer() {
  return true;
}

function readStoredCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  } catch {
    // Private browsing, storage disabled - default (expanded) stands.
    return false;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  // The tablet tier (860–1023px) always shows the icon rail regardless of
  // this preference — only the desktop tier ever reads it. Resizing within
  // a tier must never change this value; only crossing the 1024px line
  // changes which tier's rule applies.
  const isDesktopTier = useSyncExternalStore(
    subscribeToDesktopTier,
    getIsDesktopTier,
    getIsDesktopTierServer
  );

  // Read once, lazily, rather than defaulted-then-corrected in an effect —
  // safe here because the sidebar this drives is never part of any
  // server-rendered HTML in the first place (see getIsDesktopTierServer).
  const [manualCollapsed, setManualCollapsed] = useState(readStoredCollapsed);

  const toggleCollapse = () => {
    setManualCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Nothing to persist to - the preference just won't survive reload.
      }
      return next;
    });
  };

  const effectiveCollapsed = isDesktopTier ? manualCollapsed : true;

  const submitNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = navSearch.trim();
    router.push(
      term
        ? `/dashboard/patients?search=${encodeURIComponent(term)}`
        : "/dashboard/patients"
    );
  };

  // authFetch refreshes once on a 401 underneath these, so an hour-old session
  // recovers silently instead of bouncing the user out mid-task.
  const orgQuery = useOrganization();
  const userQuery = useCurrentUser();
  const refresh = useRefreshPortal();

  const org = orgQuery.data;
  const user = userQuery.data;
  const queryError = orgQuery.error ?? userQuery.error;
  const error =
    queryError && !(queryError instanceof SessionExpiredError)
      ? queryError instanceof Error
        ? queryError.message
        : "Could not reach the server."
      : null;

  useEffect(() => {
    if (queryError instanceof SessionExpiredError) router.replace("/login");
  }, [queryError, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const signOut = () => {
    // Fire the server-side blacklist, but never wait on it: the refresh
    // cookie being revoked is the server's problem, and a slow network must
    // not keep someone signed in on a shared machine while it resolves.
    void logout();
    clearAccessToken();
    // The token alone is not the session. Everything fetched for this person is
    // still in the query cache, and it must not outlive them.
    clearQueryCache();
    router.replace("/login");
  };

  if (error) {
    return (
      <div className="mc-portal">
        <div className="mc-loading">
          <div style={{ textAlign: "center", maxWidth: 380 }}>
            <p className="mc-alert mc-alert-error">{error}</p>
            <button onClick={signOut} className="mc-btn-ghost">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!org || !user) {
    return (
      <div className="mc-portal">
        <div className="mc-loading">Loading your hospital…</div>
      </div>
    );
  }

  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
    user.email[0].toUpperCase();

  const value: PortalValue = {
    org,
    user,
    isHospitalAdmin: user.role_code === "hospital_admin",
    isClinician: CLINICAL_ROLES.has(user.role_code),
    refresh: async () => refresh(),
  };

  const visibleNav = NAV.filter((item) => {
    // Hidden rather than disabled. A greyed-out link tells somebody only
    // that they are not trusted with it, without saying why.
    if (item.clinicalOnly && !value.isClinician) return false;
    if (item.adminOnly && !value.isHospitalAdmin) return false;
    return true;
  });

  const identity = {
    orgName: org.name,
    userDisplayName: displayNameFor(user),
    roleLabel: roleLabelFor(user.role_code),
    initials,
  };

  return (
    <PortalContext.Provider value={value}>
      <div className="mc-portal">
        <Sidebar
          variant="desktop"
          collapsed={effectiveCollapsed}
          navItems={visibleNav}
          pathname={pathname}
          onSignOut={signOut}
          onToggleCollapse={isDesktopTier ? toggleCollapse : undefined}
          {...identity}
        />

        <MobileSidebarDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          navItems={visibleNav}
          pathname={pathname}
          onSignOut={signOut}
          {...identity}
        />

        <div className="mc-shell">
          <AppHeader
            showMenuTrigger
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((v) => !v)}
            navSearch={navSearch}
            onNavSearchChange={setNavSearch}
            onSubmitSearch={submitNavSearch}
            initials={initials}
          />
          <div className="mc-page">{children}</div>
        </div>
      </div>
    </PortalContext.Provider>
  );
}
