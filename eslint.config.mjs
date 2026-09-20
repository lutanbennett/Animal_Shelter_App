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
    // Cloudflare adapter output — bundled Worker code, hundreds of MB.
    // Linting it runs Node out of heap.
    ".open-next/**",
    ".wrangler/**",
    "cloudflare-env.d.ts",
  ]),
  {
    rules: {
      // Photos are rendered as plain <img> on purpose: next.config.ts sets
      // images.unoptimized (no /_next/image optimizer on Cloudflare
      // Workers, and the Drive photo proxy can't go through it anyway), so
      // <Image> would emit the same <img> and the rule's advice is moot.
      // See the "Photo image proxy" entry in docs/decisions.md.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
