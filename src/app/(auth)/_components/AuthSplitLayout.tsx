import Image from "next/image";

import styles from "../login/login.module.css";

interface Pillar {
  k: string;
  v: string;
}

/**
 * The two-panel shell shared by the account-recovery screens: a photo/brand
 * panel on the left and the form on the right. `variant="ngo"` swaps the blue
 * accent for the NGO portal's teal; everything else is identical.
 */
export function AuthSplitLayout({
  variant = "hospital",
  headline,
  pillars,
  children,
}: {
  variant?: "hospital" | "ngo";
  headline: React.ReactNode;
  pillars: Pillar[];
  children: React.ReactNode;
}) {
  const ngo = variant === "ngo";

  return (
    <div className={`${styles.page}${ngo ? ` ${styles.ngo}` : ""}`}>
      <section className={styles.field}>
        <Image
          src="/images/hero-prenatal-checkup.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 900px) 100vw, 40vw"
          className="object-cover"
        />
        <div
          className={`absolute inset-0 ${ngo ? "bg-teal-900/85" : "bg-blue-900/85"}`}
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-10 p-8 text-center md:p-12">
          <Image
            src="/avatars/logo.png"
            alt="MomCare"
            width={256}
            height={171}
            className="h-auto w-40 md:w-48"
            priority
          />

          <div className="flex flex-col items-center gap-8">
            <h2 className="mb-4 max-w-[15ch] text-balance text-4xl font-bold tracking-tight text-white md:text-5xl">
              {headline}
            </h2>

            <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {pillars.map((item) => (
                <div key={item.k} className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-white">
                    {item.k}
                  </span>
                  <span
                    className={`text-[10.5px] leading-tight ${ngo ? "text-teal-100" : "text-blue-100"}`}
                  >
                    {item.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panel}>{children}</section>
    </div>
  );
}
