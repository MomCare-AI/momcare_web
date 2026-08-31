import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist or has moved.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "40px 24px",
        textAlign: "center",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <Image
        src="/avatars/logo.png"
        alt="MomCare"
        width={180}
        height={44}
        style={{ objectFit: "contain", height: 36, width: "auto" }}
      />

      <div>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: "var(--primary)",
            marginBottom: 12,
          }}
        >
          404
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}
        >
          This page doesn&apos;t exist
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-muted)",
            maxWidth: 420,
            lineHeight: 1.6,
          }}
        >
          The link may be out of date, or the page may have moved. Check the
          address, or head back to somewhere that does exist.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "var(--primary)",
            color: "white",
            padding: "13px 28px",
            borderRadius: 8,
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Back to home
        </Link>
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            color: "var(--primary)",
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
            padding: "13px 12px",
          }}
        >
          Sign in →
        </Link>
      </div>
    </div>
  );
}
