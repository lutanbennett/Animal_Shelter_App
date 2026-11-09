import type { Metadata } from "next";
import { Home } from "lucide-react";
import { ActionLink } from "@/components/ActionLink";
import { getT } from "@/lib/i18n/get-t";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";
import { entersApp } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

export const metadata: Metadata = { robots: { index: false } };

/**
 * /no-access — where a page's role check sends a signed-in app user it
 * refuses (requireRole / refuse in src/lib/auth/require-role.ts). Inside the
 * app, with its menu, rather than "/" — the public website — so a refused
 * tester or volunteer is told why and stays where they can carry on.
 *
 * Not a public path: the request proxy only lets app users this far, and
 * sends a public viewer to the home page before a guard ever runs — except
 * while the website is off, when the proxy sends that login here instead.
 */
export default async function NoAccessPage() {
  const [{ t }, perms] = await Promise.all([getT(), loadPermissions()]);
  const n = t.noAccess;
  // Home only for a login whose cards open the app. While the website is off
  // a login whose cards open nothing also lands here (src/lib/public-site.ts),
  // and for it Home would only come straight back; the header's Sign out is
  // its way on.
  const showHome = entersApp(perms);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{n.pageTitle}</h1>
        <p className="mt-1 text-sm text-muted">{n.body}</p>
      </div>
      {showHome && (
      <div>
        <ActionLink
          href={DEFAULT_SIGNED_IN_PATH}
          label={t.nav.home}
          icon={Home}
          variant="primary"
          iconOnlyOnMobile={false}
        />
      </div>
      )}
    </main>
  );
}
