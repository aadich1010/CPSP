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
    // Standalone one-off CommonJS maintenance/ops scripts run directly
    // via `node <script>.js` (admin bootstrap, data-cleanup utilities).
    // They're not part of the Next.js app bundle, so the app's
    // TS/ESM-oriented rules (no-require-imports, etc.) don't apply.
    "check_mcqs_counts.js",
    "create-admin.js",
    "fix-admin.js",
    "fix_syntax.js",
    "remove-duplicates.js",
    "update-env.js",
  ]),
]);

export default eslintConfig;
