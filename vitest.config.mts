import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // Default "forks" pool times out spawning workers in some sandboxed/restricted environments.
    pool: "threads",
    // The default 5s is too tight for the long end-to-end component tests
    // (registration wizards, review flows) when the whole suite runs at once
    // on a loaded machine: they pass in 2-3s alone. A real hang still fails.
    testTimeout: 20_000,
    setupFiles: ["./vitest.setup.ts"],
  },
});
