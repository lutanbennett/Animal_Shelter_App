import type { Metadata } from "next";
import { SignOutButton } from "@/app/login/SignOutButton";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ProductHomeLink } from "./ProductHomeLink";
import { ProductLanguageLinks } from "./ProductLanguageLinks";
import { getT } from "@/lib/i18n/get-t";

/**
 * The platform's own small shell (#pltfd): the console on the platform front door, which maps to no
 * shelter. It carries the PRODUCT's own brand (the lockup) and no shelter's name, branding, menu or
 * tasks: those read shelter tables and would come up empty here, and a shelter's own public site must
 * keep carrying that shelter's name and logo rather than this one. The app chrome is hidden for this path by PublicPathGate.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.productAdmin.platformName, robots: { index: false, follow: false } };
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  const user = await getCurrentUser();
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-6 py-3">
        <ProductHomeLink name={t.admin.productAdmin.platformName} homeLabel={t.admin.productAdmin.platformHomeLink} />
        <span className="flex flex-wrap items-center gap-4">
        <ProductLanguageLinks />
        {user && (
          <span className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="break-all">{user.email}</span>
            <SignOutButton className="whitespace-nowrap rounded py-1 text-sm font-medium text-foreground hover:text-primary" />
          </span>
        )}
        </span>
      </header>
      {children}
    </div>
  );
}
