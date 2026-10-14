import type { Metadata } from "next";

/**
 * /login, /login/forgot and /login/request are linked from every public page
 * ("Staff login"), so once the site is open a search engine would list them.
 * They are for staff; keep them out of results (docs/seo-audit-2026-10-14.md, T7).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return children;
}
