"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isPublicPage } from "@/lib/public-paths";

/**
 * Hides the app chrome (header, sidebar) on the public pages, so a
 * signed-in staff member browsing the website sees it as a visitor
 * would — one header, no sidebar — and can get back with the public
 * header's "Open the app" button. The root layout can't read the path
 * itself; this client wrapper can.
 */
export function PublicPathGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isPublicPage(pathname)) return null;
  return <>{children}</>;
}
