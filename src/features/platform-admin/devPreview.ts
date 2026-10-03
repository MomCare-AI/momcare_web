/**
 * Local-only switch to look at the Platform Admin screens without a backend or
 * a platform-admin login.
 *
 * Active only when BOTH hold: the app is running in development, and
 * NEXT_PUBLIC_PLATFORM_PREVIEW=1 is set (put it in .env.local, never in a
 * deployed environment). In a production build `NODE_ENV` is "production", so
 * this is always false and the real role check always runs.
 *
 * It reads the variables on each call (not at import) so tests can set them.
 */
export function isPlatformPreview(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_PLATFORM_PREVIEW === "1"
  );
}
