"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

import { useNgoSession } from "../hooks/useNgoSession";
import { signOutNgo } from "../services/ngoAuth";
import { NgoSidebar } from "./NgoSidebar";

/** Lightweight NGO shell: auth guard + sidebar (drawer on small screens). */
export function NgoShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useNgoSession();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  if (!session) {
    return <div className="min-h-screen bg-slate-50" aria-busy="true" />;
  }

  const signOut = () => {
    signOutNgo();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 motion-reduce:transition-none lg:block ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <NgoSidebar
          session={session}
          pathname={pathname}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onSignOut={signOut}
        />
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
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

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
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
      )}

      <main
        className={`transition-[padding] duration-200 motion-reduce:transition-none ${
          collapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
