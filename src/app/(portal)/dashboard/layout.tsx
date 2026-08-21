"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  Brain,
  CalendarDays,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import "../../portal.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface OrgSummary {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  status_display: string;
  email: string;
  phone: string;
  license_no: string;
  license_authority_display: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  owner_name: string;
  staff_count: number;
  patient_count: number;
  location_count: number;
}

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_code: string;
}

interface PortalValue {
  org: OrgSummary;
  user: CurrentUser;
  isHospitalAdmin: boolean;
  refresh: () => Promise<void>;
}

const PortalContext = createContext<PortalValue | null>(null);

/** Portal data, fetched once by the shell rather than by every page. */
export function usePortal(): PortalValue {
  const ctx = useContext(PortalContext);
  if (!ctx)
    throw new Error("usePortal must be used inside the dashboard layout");
  return ctx;
}

const NAV = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { href: "/dashboard/staff", label: "Doctors & Staff", Icon: Stethoscope },
  { href: "/dashboard/patients", label: "Patients", Icon: Users, soon: true },
  {
    href: "/dashboard/monitoring",
    label: "Health Monitoring",
    Icon: Activity,
    soon: true,
  },
  {
    href: "/dashboard/appointments",
    label: "Appointments",
    Icon: CalendarDays,
    soon: true,
  },
  {
    href: "/dashboard/insights",
    label: "AI Insights",
    Icon: Brain,
    soon: true,
  },
];

/** Approval state maps to a clinical badge; never colour alone — each carries a label. */
const STATUS_TONE: Record<OrgSummary["status"], string> = {
  approved: "stable",
  pending: "moderate",
  rejected: "high",
  suspended: "neutral",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [org, setOrg] = useState<OrgSummary | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [orgRes, meRes] = await Promise.all([
        fetch(`${API_BASE}/api/organization/me/`, { headers }),
        fetch(`${API_BASE}/api/auth/me/`, { headers }),
      ]);

      if (orgRes.status === 401 || meRes.status === 401) {
        localStorage.removeItem("access_token");
        router.replace("/login");
        return;
      }
      if (!orgRes.ok) {
        const body = await orgRes.json();
        setError(body.detail ?? "Could not load your hospital.");
        return;
      }
      setOrg(await orgRes.json());
      setUser(await meRes.json());
    } catch {
      setError("Could not reach the server.");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const signOut = () => {
    localStorage.removeItem("access_token");
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
    refresh: load,
  };

  const renderLink = (item: (typeof NAV)[number]) => {
    const { Icon } = item;
    if (item.soon) {
      return (
        <span
          key={item.href}
          className="mc-navlink"
          aria-disabled="true"
          title="Coming soon"
        >
          <Icon size={16} strokeWidth={1.9} aria-hidden />
          {item.label}
        </span>
      );
    }
    return (
      <Link
        key={item.href}
        href={item.href}
        className="mc-navlink"
        aria-current={pathname === item.href ? "page" : undefined}
      >
        <Icon size={16} strokeWidth={1.9} aria-hidden />
        {item.label}
      </Link>
    );
  };

  return (
    <PortalContext.Provider value={value}>
      <div className="mc-portal">
        <header className="mc-nav">
          <button
            className="mc-burger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <Link href="/dashboard" className="mc-brand">
            <span className="mc-brand-mark">
              <Heart
                size={19}
                strokeWidth={2.2}
                fill="currentColor"
                aria-hidden
              />
            </span>
            <span className="mc-brand-name">MomCare</span>
          </Link>

          <nav className="mc-navlinks" aria-label="Main">
            {NAV.map(renderLink)}
          </nav>

          <div className="mc-nav-right">
            <button
              className="mc-iconbtn"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={17} strokeWidth={1.9} />
            </button>
            <div className="mc-user">
              <span className="mc-avatar" aria-hidden>
                {initials}
              </span>
              <span className="mc-user-text">
                <span className="mc-user-name">
                  {user.first_name} {user.last_name}
                </span>
                <span className="mc-user-role">
                  {value.isHospitalAdmin
                    ? "Hospital administrator"
                    : user.role_code.replace("_", " ")}
                </span>
              </span>
            </div>
            <button
              className="mc-iconbtn"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} strokeWidth={1.9} />
            </button>
          </div>
        </header>

        <div
          className="mc-drawer"
          data-open={menuOpen}
          onClick={() => setMenuOpen(false)}
        >
          <nav
            className="mc-drawer-panel"
            aria-label="Mobile"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV.map(renderLink)}
          </nav>
        </div>

        <div className="mc-page">
          <div className="mc-org">
            <div>
              <div className="mc-org-name">{org.name}</div>
              <div className="mc-org-meta">
                <MapPin size={13} strokeWidth={2} aria-hidden />
                {[org.city, org.state, org.country].filter(Boolean).join(", ")}
              </div>
            </div>
            <div className="mc-org-right">
              <span className={`mc-badge mc-badge-${STATUS_TONE[org.status]}`}>
                {org.status_display}
              </span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </PortalContext.Provider>
  );
}
