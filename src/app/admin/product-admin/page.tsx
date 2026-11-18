import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { TWO_STEP_PATH, hasTwoStep } from "@/lib/auth/two-step";
import { isProductAdmin } from "@/lib/auth/product-admin";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { ProductAdminPanel, type PadminRow, type ShelterRow } from "./ProductAdminPanel";

/**
 * Settings → Product admin (#shmgt). Who may see it is a list of people, not a role or a card
 * (is_product_admin(); Lutan, 2026-11-18). A login not on the list gets the same not-found as any
 * address that does not exist, so nothing says the page is here. Hiding is the courtesy: the
 * database refuses everything this page reads or writes to anyone not on the list.
 */
export default async function ProductAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isProductAdmin())) notFound();

  const { t } = await getT();
  const [shelters, admins, twoStep] = await Promise.all([
    supabase.rpc("product_admin_shelters"),
    supabase.from("product_admins").select("user_id, created_at").order("created_at"),
    hasTwoStep(),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <BackLink href="/admin">{t.admin.landing.title}</BackLink>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.admin.productAdmin.title}</h1>
        <p className="max-w-prose text-sm text-muted">{t.admin.productAdmin.subtitle}</p>
      </div>
      <ProductAdminPanel
        shelters={(shelters.data ?? []) as ShelterRow[]}
        admins={((admins.data ?? []) as { user_id: string; created_at: string }[]).map(
          (a): PadminRow => ({ userId: a.user_id, createdAt: a.created_at }),
        )}
        selfId={user.id}
        selfEmail={user.email ?? null}
        // The writes need aal2 (0411's restrictive policies), so Add and Remove are drawn only then.
        canWrite={twoStep}
        stepUpPath={TWO_STEP_PATH}
      />
    </main>
  );
}
