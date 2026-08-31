import type { Metadata } from "next";
import { LandingPageClient } from "./components/LandingPageClient";
import { SITE_URL } from "@/core/config/siteUrl";

// The root page shares its route segment with the root layout, so
// layout.tsx's title.template does NOT apply here (Next.js only templates
// nested segments) - the " · MomCare" suffix has to be written explicitly.
const title = "Remote Maternal Health Monitoring for Hospitals · MomCare";
const description =
  "MomCare gives hospitals continuous wearable vitals, a documented clinical risk engine, and a timed escalation ladder — so a warning sign between visits never waits to be noticed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "MomCare",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MomCare — Remote Maternal Health Monitoring for Hospitals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MomCare",
  url: SITE_URL,
  logo: `${SITE_URL}/avatars/logo.png`,
  description,
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MomCare",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description,
  offers: {
    "@type": "Offer",
    category: "B2B SaaS",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationJsonLd),
        }}
      />
      <LandingPageClient />
    </>
  );
}
