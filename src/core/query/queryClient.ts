import { QueryClient, isServer } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

/**
 * Drop everything the cache is holding, because the person using it changed.
 *
 * The browser client is a module-level singleton, so it survives sign-out and
 * the next sign-in. Without this the portal renders the *previous* user until
 * the refetch lands - their name, their hospital, their patients - which is
 * both a visible bug and one user's clinical data sitting in another user's
 * session.
 *
 * Call this on every identity change: signing out, and signing in.
 */
export function clearQueryCache(): void {
  browserQueryClient?.clear();
}
