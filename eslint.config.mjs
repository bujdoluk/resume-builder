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
    // Static assets only — includes pdf.worker.min.mjs, copied in by
    // scripts/copy-pdf-worker.mjs (postinstall), which is a giant
    // minified third-party bundle, not source to lint.
    "public/**",
  ]),
]);

export default eslintConfig;
