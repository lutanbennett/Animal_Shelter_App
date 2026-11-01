"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionRefusal, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { checkHttpsUrl, linkErrorText } from "@/lib/links/validate";
import { driveErrorMessage } from "@/lib/google/drive-errors";
import { trashShopPhoto, uploadShopPhoto } from "@/lib/shop/upload";

/**
 * Writes to shop_links (0285). Every action asks shop.manage at edit, the activity the table's
 * policies ask (has_permission('shop.manage')); the screen draws a control only when the same
 * check passes. The database repeats the https rule (shop_links_url_https) as its last line.
 */

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});
export type ShopSaved = ActionResult<{ success?: string }>;

function revalidateShop() {
  revalidatePath("/admin/shop");
  revalidatePath("/shop");
  revalidatePath("/donate");
}

async function allowed() {
  return can(await loadPermissions(), "shop.manage", "edit");
}

function text(formData: FormData, name: string) {
  return (formData.get(name) as string | null)?.trim() ?? "";
}

/**
 * Add a shop or a Shelter Friend (no `id`), or change an entry (with `id`). A Friend's entry keeps
 * only link, note and price hint: its name and logo are read from the Friend's profile.
 */
export async function saveShopLink(_state: ShopSaved | undefined, formData: FormData): Promise<ShopSaved> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("shop.save", write(t), { id: writeRequestIdFrom(formData), action: "shop.save", db: supabase }, async () => {
    const m = t.shop.manage;
    if (!(await allowed())) return refuse(m.noPermission);

    const id = text(formData, "id");
    const friendId = text(formData, "friend_id");
    const title = text(formData, "title");

    // On an edit the kind is the stored one, never the request's.
    let isFriend = !!friendId;
    if (id) {
      const { data, error } = await supabase
        .from("shop_links")
        .select("friend_id")
        .eq("id", id)
        .limit(1)
        .returns<{ friend_id: string | null }[]>();
      if (error) return refuse(error.message);
      if (!data?.length) return refuse(m.errors.notFound);
      isFriend = data[0].friend_id !== null;
    }
    if (!isFriend && !title) return refuse(m.errors.nameRequired);

    const link = checkHttpsUrl(text(formData, "link_url"));
    if (!link.ok) return refuse(linkErrorText(t.linkErrors, link) ?? m.errors.linkRequired);
    if (link.url === null) return refuse(m.errors.linkRequired);

    const row = {
      link_url: link.url,
      note: text(formData, "note") || null,
      price_hint: text(formData, "price_hint") || null,
    };

    if (id) {
      const { data, error } = await supabase
        .from("shop_links")
        .update(isFriend ? row : { ...row, title })
        .eq("id", id)
        .select("id")
        .returns<{ id: string }[]>();
      if (error) return refuse(error.message);
      if (!data?.length) return refuse(m.errors.notFound);
      revalidateShop();
      return { ok: true, success: t.common.saved };
    }

    const { data: last, error: readError } = await supabase
      .from("shop_links")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .returns<{ sort_order: number }[]>();
    if (readError) return refuse(readError.message);
    const sort_order = (last?.[0]?.sort_order ?? 0) + 1;

    if (isFriend) {
      const { error } = await supabase.from("shop_links").insert({ ...row, friend_id: friendId, sort_order });
      if (error) return refuse(error.code === "23505" ? m.errors.friendTaken : error.message);
    } else {
      const { error } = await supabase.from("shop_links").insert({ ...row, title, sort_order });
      if (error) return refuse(error.message);
    }
    revalidateShop();
    return { ok: true, success: m.addedNamed(isFriend ? m.friendPick : title) };
  });
}

/** Show or hide an entry on /shop. Hiding keeps everything typed; the database keeps a hidden entry from anon. */
export async function setShopLinkShown(id: string, shown: boolean, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("shop.setShown", write(t), { id: requestId, action: "shop.setShown", db: supabase }, async () => {
    if (!(await allowed())) return refuse(t.shop.manage.noPermission);
    const { data, error } = await supabase
      .from("shop_links")
      .update({ shown })
      .eq("id", id)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return refuse(error.message);
    if (!data?.length) return refuse(t.shop.manage.errors.notFound);
    revalidateShop();
    return { ok: true };
  });
}

/** Move an entry one place up or down; the order is renumbered so equal numbers never stick. */
export async function moveShopLink(id: string, direction: "up" | "down", requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("shop.move", write(t), { id: requestId, action: "shop.move", db: supabase }, async () => {
    if (!(await allowed())) return refuse(t.shop.manage.noPermission);
    const { data, error } = await supabase
      .from("shop_links")
      .select("id")
      .order("sort_order")
      .order("created_at")
      .returns<{ id: string }[]>();
    if (error) return refuse(error.message);
    const ids = (data ?? []).map((r) => r.id);
    const from = ids.indexOf(id);
    if (from === -1) return refuse(t.shop.manage.errors.notFound);
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= ids.length) return { ok: true };
    [ids[from], ids[to]] = [ids[to], ids[from]];
    for (const [index, rowId] of ids.entries()) {
      const { error: updateError } = await supabase.from("shop_links").update({ sort_order: index + 1 }).eq("id", rowId);
      if (updateError) return refuse(updateError.message);
    }
    revalidateShop();
    return { ok: true };
  });
}

export async function deleteShopLink(id: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("shop.delete", write(t), { id: requestId, action: "shop.delete", db: supabase }, async () => {
    if (!(await allowed())) return refuse(t.shop.manage.noPermission);
    const { data: current } = await supabase
      .from("shop_links")
      .select("photo_drive_file_id")
      .eq("id", id)
      .limit(1)
      .returns<{ photo_drive_file_id: string | null }[]>();
    const { error } = await supabase.from("shop_links").delete().eq("id", id);
    if (error) return refuse(error.message);
    const photo = current?.[0]?.photo_drive_file_id;
    if (photo) await trashShopPhoto(photo);
    revalidateShop();
    return { ok: true };
  });
}

/** The photo of a shop or product. Replaces the old one (to Drive's trash). A Friend's picture is its logo, not set here. */
export async function uploadShopPhotoAction(formData: FormData): Promise<ShopSaved> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("shop.uploadPhoto", write(t), { id: writeRequestIdFrom(formData), action: "shop.uploadPhoto", db: supabase }, async () => {
    const m = t.shop.manage;
    if (!(await allowed())) return refuse(m.noPermission);
    const id = text(formData, "id");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return refuse(m.errors.noFile);
    const { data: current } = await supabase
      .from("shop_links")
      .select("friend_id, photo_drive_file_id")
      .eq("id", id)
      .limit(1)
      .returns<{ friend_id: string | null; photo_drive_file_id: string | null }[]>();
    if (!current?.length || current[0].friend_id) return refuse(m.errors.notFound);

    let driveFileId: string;
    try {
      driveFileId = await uploadShopPhoto(file, t);
    } catch (err) {
      return refuse(await driveErrorMessage(err, t.admin.website.errors.uploadFailed));
    }
    const { error } = await supabase.from("shop_links").update({ photo_drive_file_id: driveFileId }).eq("id", id);
    if (error) return refuse(error.message);
    if (current[0].photo_drive_file_id) await trashShopPhoto(current[0].photo_drive_file_id);
    revalidateShop();
    return { ok: true, success: m.photoUpdated };
  });
}

export async function removeShopPhoto(id: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("shop.removePhoto", write(t), { id: requestId, action: "shop.removePhoto", db: supabase }, async () => {
    if (!(await allowed())) return refuse(t.shop.manage.noPermission);
    const { data: current } = await supabase
      .from("shop_links")
      .select("photo_drive_file_id")
      .eq("id", id)
      .limit(1)
      .returns<{ photo_drive_file_id: string | null }[]>();
    const { error } = await supabase.from("shop_links").update({ photo_drive_file_id: null }).eq("id", id);
    if (error) return refuse(error.message);
    const photo = current?.[0]?.photo_drive_file_id;
    if (photo) await trashShopPhoto(photo);
    revalidateShop();
    return { ok: true };
  });
}
