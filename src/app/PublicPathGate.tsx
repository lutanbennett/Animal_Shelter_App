"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isChromelessPath } from "@/lib/public-paths";

/**
 * Hides the app chrome (header, sidebar) on the public pages, so a
 * signed-in staff member browsing the website sees it as a visitor
 * would — one header, no sidebar — and can get back with the public
 * header's "Open the app" button. The root layout can't read the path
 * itself; this client wrapper can.
 */
export function PublicPathGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // The second step (TWO_STEP_PATH in src/lib/auth/two-step.ts, which is server-only so not imported here) belongs to the person, not a shelter: it is a bare page.
  // The adopter page draws its own small header: an adopter holds no card, so the staff chrome has nothing for them.
  if (isPublicPage(pathname) || pathname === "/adopter-update" || pathname === "/platform" || pathname === "/admin/security/verify" || pathname.startsWith("/platform/")) return null;
  return <>{children}</>;
}
