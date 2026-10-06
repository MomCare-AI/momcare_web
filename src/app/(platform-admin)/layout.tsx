import type { Metadata } from "next";

// The platform console is an internal tool: never listed in search results.
// (Its own layout is a client component, which cannot export metadata.)
export const metadata: Metadata = {
  title: "Platform console",
  robots: { index: false, follow: false },
};

export default function PlatformAdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
