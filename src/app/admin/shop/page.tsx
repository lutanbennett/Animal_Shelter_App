import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { can } from "@/lib/permissions/can";
import type { FriendChoice, ShopLinkRow } from "@/lib/shop/shop-links";
import { ShopLinksEditor } from "./ShopLinksEditor";

/**
 * Settings → Shop for the shelter (0285): the entries on the public /shop page. The card
 * manage_shop_page opens it. Reading needs shop.manage at read; every control asks edit, the
 * activity the actions and the table's policies ask.
 */
export default async function ShopManagePage() {
  const { perms } = await requirePermission("shop.manage", "read");
  const { t } = await getT();
  const m = t.shop.manage;
  const canEdit = can(perms, "shop.manage", "edit");

  const supabase = await createClient();
  const [{ data: links, error }, { data: friends }] = await Promise.all([
    supabase
      .from("shop_links")
      .select("id, friend_id, title, link_url, note, price_hint, photo_drive_file_id, sort_order, shown")
      .order("sort_order")
      .order("created_at")
      .returns<Omit<ShopLinkRow, "friend">[]>(),
    // Published Friends, by name, from the public view: the same names the public page will show.
    supabase.from("public_shelter_friends").select("id, name, logo_drive_file_id").order("name").returns<
      { id: string; name: string; logo_drive_file_id: string | null }[]
    >(),
  ]);

  const byId = new Map((friends ?? []).map((f) => [f.id, f]));
  const rows: ShopLinkRow[] = (links ?? []).map((l) => ({
    ...l,
    // A Friend that is unpublished has no public name; show that it is not currently on the page rather than a blank.
    friend: l.friend_id ? (byId.get(l.friend_id) ?? { name: "—", logo_drive_file_id: null }) : null,
  }));
  const taken = new Set((links ?? []).map((l) => l.friend_id).filter(Boolean));
  const choices: FriendChoice[] = (friends ?? []).filter((f) => !taken.has(f.id)).map((f) => ({ id: f.id, name: f.name }));

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
        <p className="text-sm text-muted">
          {m.subtitle}{" "}
          <Link href="/shop" target="_blank" className="text-primary hover:underline">
            {m.viewPage}
          </Link>
        </p>
      </div>
      {error && (
        <p className="text-sm text-danger">
          {t.shop.couldntLoad}: {error.message}
        </p>
      )}
      <ShopLinksEditor rows={rows} friends={choices} canEdit={canEdit} />
    </main>
  );
}
