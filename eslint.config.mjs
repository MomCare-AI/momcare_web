import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored shadcn/animate-ui registry components — copied in via the
    // `shadcn` CLI, not hand-written. Their source predates our stricter
    // react-hooks/react-compiler lint rules and shouldn't be edited to
    // chase them, since `shadcn add` will just overwrite fixes on update.
    "src/components/animate-ui/**",
  ]),
]);

export default eslintConfig;
