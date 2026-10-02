"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Menu, X } from "lucide-react";

import { useNgoSession } from "../hooks/useNgoSession";
import { useSidebarCollapsed } from "../hooks/useSidebarCollapsed";
import { signOutNgo } from "../services/ngoAuth";
import { NgoShellSkeleton } from "./NgoSkeletons";
import { NgoSidebar } from "./NgoSidebar";

const EASE = "duration-300 ease-in-out motion-reduce:transition-none";

/** Lightweight NGO shell: auth guard + sidebar (drawer on small screens). */
export function NgoShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useNgoSession();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useSidebarCollapsed();

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  // Ctrl/Cmd+B toggles the sidebar, as in most editors and admin tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, setCollapsed]);

  // Mobile drawer: Esc closes it, and the page behind it doesn't scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session) {
    return <NgoShellSkeleton />;
  }

  const signOut = () => {
    signOutNgo();
    router.replace("/login");
  };
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden transition-[width] will-change-[width] md:block ${EASE} ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <NgoSidebar
          session={session}
          pathname={pathname}
          collapsed={collapsed}
          onSignOut={signOut}
        />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          title={`${toggleLabel} (Ctrl+B)`}
          className="absolute -right-3 top-6 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-teal-700 bg-white text-teal-700 shadow transition-colors hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          {collapsed ? (
            <ChevronsRight size={14} aria-hidden />
          ) : (
            <ChevronsLeft size={14} aria-hidden />
          )}
        </button>
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
        >
          <Menu size={20} aria-hidden />
        </button>
        <span className="text-sm font-semibold">
          {session.organizationName}
        </span>
      </header>

      {/* Always mounted so it can slide; inert + pointer-events off when shut. */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${open ? "" : "pointer-events-none"}`}
        inert={!open}
      >
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity ${EASE} ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute inset-y-0 left-0 w-64 shadow-xl transition-transform ${EASE} ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-teal-50 hover:bg-white/10"
          >
            <X size={18} aria-hidden />
          </button>
          <NgoSidebar
            session={session}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
            onSignOut={signOut}
          />
        </div>
      </div>

      <main
        className={`transition-[padding-left] ${EASE} ${
          collapsed ? "md:pl-16" : "md:pl-64"
        }`}
      >
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
