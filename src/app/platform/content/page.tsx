import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { stepUpHref, hasTwoStep } from "@/lib/auth/two-step";
import { isProductAdmin } from "@/lib/auth/product-admin";
import { getT } from "@/lib/i18n/get-t";
import { isPlatformHostname, platformHost, requestHost } from "@/lib/site-hosts";
import { createClient } from "@/lib/supabase/server";
import { ProductContentEditor, type ContentRow } from "./ProductContentEditor";

/**
 * The product site's words and photos (#pcmsx): every line of every cooperjaidee.org page, English and Thai side by side.
 * Gated exactly as /platform is (the page's own comment there says why): a list of people, not a role and not a card
 * (is_product_admin(), Lutan 2026-11-18), and a login not on the list gets the same not-found as an address that does
 * not exist. The rows are read through the public view, which is what the public pages read, so what is shown here is
 * what a visitor sees. The writes need aal2 (0441), so every control that acts is drawn only then.
 */
export default async function ProductContentPage() {
  const h = await headers();
  if (platformHost() && !isPlatformHostname(requestHost((n) => h.get(n)) ?? "")) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isProductAdmin())) notFound();
  const { t } = await getT();
  const c = t.admin.productAdmin.content;

  const [{ data }, twoStep] = await Promise.all([
    supabase.from("public_platform_content").select("page, key, en, th, drive_file_id").order("page").order("key").limit(5000).returns<
      { page: string; key: string; en: string; th: string; drive_file_id: string | null }[]
    >(),
    hasTwoStep(),
  ]);
  const rows: ContentRow[] = (data ?? []).map((r) => ({ page: r.page, key: r.key, en: r.en, th: r.th, driveFileId: r.drive_file_id }));

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <a href="/platform" className="text-sm font-medium text-primary underline">
          ← {c.back}
        </a>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{c.title}</h1>
        <p className="max-w-prose text-sm text-muted">{c.intro}</p>
      </div>
      <ProductContentEditor rows={rows} canWrite={twoStep} stepUpPath={stepUpHref("/platform/content")} />
    </main>
  );
}
