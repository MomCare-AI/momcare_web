import type { Metadata } from "next";
import { AcceptInvitePageClient } from "./components/AcceptInvitePageClient";

export const metadata: Metadata = {
  title: "Accept Your Invitation",
  description:
    "Accept a staff invitation to join your hospital's MomCare account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <AcceptInvitePageClient token={token} />;
}
