'use client'

import AppShell from '@/components/layout/AppShell'
import { LayoutDashboard, Users, Watch, Siren, Building2 } from 'lucide-react'
import type { NavItemConfig } from '@/components/layout/NavItem'

const NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', href: '/ngo', icon: LayoutDashboard },
  { label: 'Patients', href: '/ngo/patients', icon: Users },
  { label: 'Health Bands', href: '/ngo/bands', icon: Watch },
  { label: 'Emergency', href: '/ngo/emergency', icon: Siren },
  { label: 'Onboarding', href: '/ngo/onboarding', icon: Building2 },
]

export default function NgoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portalName="NGO Portal" navItems={NAV_ITEMS}>
      {children}
    </AppShell>
  )
}
