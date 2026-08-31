"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
            color: "var(--coral)",
            marginBottom: 12,
          }}
        >
          Something went wrong
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
          That didn&apos;t load right
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-muted)",
            maxWidth: 420,
            lineHeight: 1.6,
          }}
        >
          Nothing was lost — try again, or head back to the homepage. If it
          keeps happening, let us know what you were doing when it broke.
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
        <button
          type="button"
          onClick={reset}
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
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
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
          Back to home →
        </Link>
      </div>
    </div>
  );
}
