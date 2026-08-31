import type { Metadata } from "next";

// Every portal route is authenticated hospital/patient data — none of it
// belongs in a search index, and nothing here should be followed out to.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
