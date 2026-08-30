import type { Metadata } from "next";
import { Inter, Outfit, Fraunces, Familjen_Grotesk } from "next/font/google";
import { QueryProvider } from "@/core/query/QueryProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

// Landing-page headlines only — see the `.landing`-scoped override in
// globals.css. Kept separate from --font-outfit so the portal dashboard's
// headline font is untouched. A free stand-in for Axalp Grotesk (a paid
// ROHH Type Foundry face) — same Swiss neo-grotesque character, elegant
// rounded shapes mixed with sharp angular cuts.
const familjenGrotesk = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Was still the scaffold's "Create Next App", which is what every browser tab
  // and every bookmark of this deployment has been showing.
  title: {
    default: "MomCare",
    template: "%s · MomCare",
  },
  description:
    "Remote patient monitoring for maternal health. Continuous vitals, graded risk, and alerts that escalate until someone answers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${fraunces.variable} ${familjenGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
