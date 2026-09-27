import type { Metadata } from "next";
import { ListTodo } from "lucide-react";
import { ActionLink } from "@/components/ActionLink";
import { getT } from "@/lib/i18n/get-t";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/next-path";

export const metadata: Metadata = { robots: { index: false } };

/**
 * /no-access — where a page's role check sends a signed-in app user it
 * refuses (requireRole / refuse in src/lib/auth/require-role.ts). Inside the
 * app, with its menu, rather than "/" — the public website — so a refused
 * tester or volunteer is told why and stays where they can carry on.
 *
 * Not a public path: the request proxy only lets app users this far, and
 * sends a public viewer to the home page before a guard ever runs.
 */
export default async function NoAccessPage() {
  const { t } = await getT();
  const n = t.noAccess;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{n.pageTitle}</h1>
        <p className="mt-1 text-sm text-muted">{n.body}</p>
      </div>
      <div>
        <ActionLink
          href={DEFAULT_SIGNED_IN_PATH}
          label={n.goToMy}
          icon={ListTodo}
          variant="primary"
          iconOnlyOnMobile={false}
        />
      </div>
    </main>
  );
}
