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
    // Leftover app-cut worktrees hold .next/.open-next output; linting it ran Node out of heap.
    ".claude/**",
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
  {
    // The service-role client bypasses RLS. Only these files may import it;
    // each guards its own callers (permission check, admin check or bearer
    // key). Allow-list, not a pattern: a new importer is a decision.
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/app/account/password/actions.ts",
      "src/app/admin/recent-changes/page.tsx",
      "src/app/admin/security/actions.ts",
      "src/app/admin/security/page.tsx",
      "src/app/admin/security/role-options.ts",
      "src/app/admin/security/verify/actions.ts",
      "src/app/admin/who-does-what/page.tsx",
      "src/app/admin/who-does-what/details/page.tsx",
      "src/app/admin/who-does-what/roles.ts",
      "src/lib/home/roles.ts",
      "src/lib/auth/held-roles.ts",
      "src/lib/facility-map/plan-store.ts",
      "src/lib/status/access-requests.ts",
      "src/lib/clinics/calendar-sync.ts",
      "src/lib/status/alerts.ts",
      "src/lib/status/health.ts",
      "src/lib/status/usage.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message:
                "The service-role client bypasses RLS. Add this file to the allow-list in eslint.config.mjs only if it guards its own callers.",
            },
          ],
        },
      ],
    },
  },
  {
    // CommonJS by definition (Node `-r` preload scripts); `require` is the
    // only import there is. Without this, `npm run lint` — and CI — fail on
    // scripts/win-junction-symlinks.cjs.
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
