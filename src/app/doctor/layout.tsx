'use client'

import AppShell from '@/components/layout/AppShell'
import { LayoutDashboard, Users, FlaskConical, CalendarDays, AlertCircle } from 'lucide-react'
import type { NavItemConfig } from '@/components/layout/NavItem'

const NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
  { label: 'Patients', href: '/doctor/patients', icon: Users },
  { label: 'Lab Verification', href: '/doctor/lab-verification', icon: FlaskConical },
  { label: 'Schedules', href: '/doctor/schedules', icon: CalendarDays },
  { label: 'Alerts', href: '/doctor/alerts', icon: AlertCircle },
]

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portalName="Doctor Portal" navItems={NAV_ITEMS}>
      {children}
    </AppShell>
  )
}
