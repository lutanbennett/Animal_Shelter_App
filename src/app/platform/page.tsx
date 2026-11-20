import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { stepUpHref, hasTwoStep } from "@/lib/auth/two-step";
import { isProductAdmin } from "@/lib/auth/product-admin";
import { getT } from "@/lib/i18n/get-t";
import { appHost, isPlatformHostname, platformHost, requestHost } from "@/lib/site-hosts";
import { createClient } from "@/lib/supabase/server";
import { ProductAdminPanel, type PersonRow, type ShelterRow } from "./ProductAdminPanel";

/**
 * The operator console (#shmgt, moved here by #pltfd): the platform's own front door, outside every shelter's
 * site. Who may see it is a list of people, not a role or a card (is_product_admin(); Lutan, 2026-11-18). A login
 * not on the list gets the same not-found as any address that does not exist, so nothing says the page is here.
 * Hiding is the courtesy: the database refuses everything this page reads or writes to anyone not on the list.
 *
 * Where PLATFORM_HOST is set, only that host serves this page; a shelter's own address answers not-found, so the
 * console is not reachable from inside any shelter's site. Unset (next dev, test) it answers wherever it is asked.
 */
export default async function PlatformPage() {
  const h = await headers();
  if (platformHost() && !isPlatformHostname(requestHost((n) => h.get(n)) ?? "")) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { t } = await getT();
  if (!(await isProductAdmin())) {
    // #cjred: a signed-in login that is not on the list is told where to go, and nothing about what is here.
    const app = appHost();
    return (
      <main className="flex flex-1 flex-col gap-3 p-6">
        <p className="max-w-prose text-sm text-foreground">{t.admin.productAdmin.wrongDoor}</p>
        <a href={app ? `https://${app}/home` : "/home"} className="w-fit text-sm font-medium text-primary underline">
          {t.admin.productAdmin.wrongDoorLink}
        </a>
      </main>
    );
  }

  const [shelters, people, twoStep] = await Promise.all([
    supabase.rpc("product_admin_shelters"),
    supabase.rpc("product_admin_people"),
    hasTwoStep(),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.admin.productAdmin.title}</h1>
        <p className="max-w-prose text-sm text-muted">{t.admin.productAdmin.subtitle}</p>
      </div>
      <ProductAdminPanel
        shelters={(shelters.data ?? []) as ShelterRow[]}
        people={((people.data ?? []) as { kind: string; shelter_id: string | null; user_id: string; email: string | null }[]).map(
          (p): PersonRow => ({ kind: p.kind, shelterId: p.shelter_id, userId: p.user_id, email: p.email }),
        )}
        selfId={user.id}
        // The writes need aal2 (0411's restrictive policies), so every control that acts is drawn only then.
        canWrite={twoStep}
        stepUpPath={stepUpHref("/platform")}
      />
    </main>
  );
}
