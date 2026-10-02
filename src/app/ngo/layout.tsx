import type { Metadata } from "next";

import { NgoShell } from "@/features/ngo/components/NgoShell";

export const metadata: Metadata = {
  title: "NGO Portal — MomCare",
  robots: { index: false },
};

export default function NgoLayout({ children }: { children: React.ReactNode }) {
  return <NgoShell>{children}</NgoShell>;
}
