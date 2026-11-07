"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { writeRequestIdFrom } from "@/lib/write-requests";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { checkPostUrl } from "@/lib/memes/form";
import { isPlatform } from "@/lib/memes/platforms";
import { parseTagField, TAGS_FIELD_SUFFIX, type NoteTag } from "@/lib/note-tags/text";
import { checkReelFields, REEL_NOTE_MAX, splitDescription } from "@/lib/reels/form";

// PI FAILOVER (D): every write here goes through runWriteAction() (docs/decisions/2026-11-01-write-paths-tail-a.md),
// so /reels/[id] and /reels/[id]/edit are on WRAPPED_WRITE_PATHS. A write added to this file goes through it too.
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

/**
 * The reels library's writes (0322, split by 0329). Changing a reel and recording a post ask social.reels; archiving and taking a post
 * record off ask social.reels_manage. The database asks the same in the per-command reels, reel_residents and social_shares policies,
 * so a stale page or a hand-made request is refused there too. Adding a reel is NOT here: it is the upload routes
 * /api/reels/start and /finish, because the video goes to Drive from the browser.
 * docs/decisions/2026-11-06-reels-app.md.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidateReel(id?: string, residentIds: readonly string[] = []) {
  revalidatePath("/reels");
  if (id) revalidatePath(`/reels/${id}`);
  for (const r of residentIds) revalidatePath(`/residents/${r}`);
}

/**
 * Change the description and the date taken, and bring the residents and hashtags in step with the new words. The
 * picks come from the box's hidden field; a form without it (a login that cannot tag) keeps the reel's existing links,
 * which still stand while their "#name" is in the text, exactly as in a resident's note.
 */
export async function updateReel(id: string, formData: FormData): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.reels.form.errors;
  return runWriteAction(
    "reels.update",
    write(t),
    { id: writeRequestIdFrom(formData), action: "reels.update", db: await createClient() },
    async () => {
      const perms = await loadPermissions();
      if (!can(perms, "social.reels")) return { ok: false, error: t.reels.errors.notAllowed };
      if (!UUID.test(id)) return { ok: false, error: e.notFound };

      const description = (formData.get("description") as string | null) ?? "";
      const dateTaken = (formData.get("dateTaken") as string | null) ?? "";
      const problem = checkReelFields({ description, dateTaken });
      if (problem) return { ok: false, error: e[problem] };

      const supabase = await createClient();
      const { data: before } = await supabase
        .from("reel_residents")
        .select("resident_id, residents(id, name)")
        .eq("reel_id", id)
        .returns<{ resident_id: string; residents: { id: string; name: string } | { id: string; name: string }[] | null }[]>();
      const had = new Set((before ?? []).map((r) => r.resident_id));

      const rawPicks = formData.get("description" + TAGS_FIELD_SUFFIX);
      const picks: NoteTag[] =
        rawPicks !== null
          ? parseTagField(rawPicks)
          : (before ?? []).flatMap((r) => {
              const res = Array.isArray(r.residents) ? r.residents[0] : r.residents;
              return res ? [{ id: res.id, name: res.name }] : [];
            });
      const { residentIds, tags } = splitDescription(description, picks);

      const { data, error } = await supabase
        .from("reels")
        .update({ description: description.trim(), date_taken: dateTaken, tags })
        .eq("id", id)
        .select("id")
        .returns<{ id: string }[]>();
      if (error) return { ok: false, error: e.saveFailed };
      if (!data?.[0]) return { ok: false, error: e.notFound };

      const wanted = new Set(residentIds);
      const toRemove = [...had].filter((r) => !wanted.has(r));
      const toAdd = [...wanted].filter((r) => !had.has(r));
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase.from("reel_residents").delete().eq("reel_id", id).in("resident_id", toRemove);
        if (removeError) return { ok: false, error: e.saveFailed };
      }
      if (toAdd.length > 0) {
        const { error: addError } = await supabase.from("reel_residents").insert(toAdd.map((resident_id) => ({ reel_id: id, resident_id })));
        if (addError) return { ok: false, error: e.saveFailed };
      }

      revalidateReel(id, [...had, ...wanted]);
      return { ok: true };
    },
  );
}

/** Archive (or bring back) a reel: `archived` flips, nothing is deleted, and where it was posted stays. */
export async function setReelArchived(id: string, archived: boolean, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.reels.form.errors;
  return runWriteAction(
    "reels.archive",
    write(t),
    { id: requestId, action: "reels.archive", db: await createClient() },
    async () => {
      const perms = await loadPermissions();
      if (!can(perms, "social.reels_manage")) return { ok: false, error: t.reels.errors.notAllowed };
      if (!UUID.test(id)) return { ok: false, error: e.notFound };
      const supabase = await createClient();
      const [{ data, error }, { data: links }] = await Promise.all([
        supabase.from("reels").update({ archived }).eq("id", id).select("id").returns<{ id: string }[]>(),
        supabase.from("reel_residents").select("resident_id").eq("reel_id", id).returns<{ resident_id: string }[]>(),
      ]);
      if (error) return { ok: false, error: e.saveFailed };
      if (!data?.[0]) return { ok: false, error: e.notFound };
      revalidateReel(id, (links ?? []).map((l) => l.resident_id));
      return { ok: true };
    },
  );
}

export type ReelShareInput = { platform: string; sharedOn: string; postUrl: string; note: string };

/**
 * Record where and when a reel was posted: ordinary bookkeeping (Lutan, 2026-11-05, #i7qkz). It puts nothing on the
 * website and gives the reel no path to it. recorded_by is stamped by the database.
 */
export async function recordReelShare(reelId: string, input: ReelShareInput, requestId: string | null): Promise<ActionResult<{ id: string }>> {
  const { t } = await getT();
  const e = t.memes.share.errors;
  return runWriteAction<{ id: string }>(
    "reels.recordShare",
    write(t),
    { id: requestId, action: "reels.recordShare", db: await createClient() },
    async () => {
      const perms = await loadPermissions();
      if (!can(perms, "social.reels")) return { ok: false, error: t.reels.errors.notAllowed };
      if (!UUID.test(reelId)) return { ok: false, error: t.reels.form.errors.notFound };
      if (!isPlatform(input.platform)) return { ok: false, error: e.badPlatform };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.sharedOn) || Number.isNaN(new Date(input.sharedOn).getTime())) {
        return { ok: false, error: e.badDate };
      }
      const postUrl = input.postUrl.trim();
      if (!checkPostUrl(postUrl)) return { ok: false, error: e.badLink };
      const note = input.note.trim();
      if (note.length > REEL_NOTE_MAX) return { ok: false, error: e.noteLong };

      const supabase = await createClient();
      const { data, error } = await supabase
        .from("social_shares")
        .insert({
          owner_type: "reel",
          owner_id: reelId,
          platform: input.platform,
          shared_on: input.sharedOn,
          post_url: postUrl || null,
          note: note || null,
        })
        .select("id")
        .single<{ id: string }>();
      if (error || !data) {
        console.error("Reel share insert failed:", error);
        return { ok: false, error: t.reels.form.errors.saveFailed };
      }
      revalidateReel(reelId);
      return { ok: true, id: data.id };
    },
  );
}

/** Take a post record off (a mistaken entry). The post itself is untouched. */
export async function removeReelShare(reelId: string, shareId: string, requestId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  return runWriteAction(
    "reels.removeShare",
    write(t),
    { id: requestId, action: "reels.removeShare", db: await createClient() },
    async () => {
      const perms = await loadPermissions();
      if (!can(perms, "social.reels_manage")) return { ok: false, error: t.reels.errors.notAllowed };
      if (!UUID.test(reelId) || !UUID.test(shareId)) return { ok: false, error: t.memes.share.errors.notFound };
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("social_shares")
        .delete()
        .eq("id", shareId)
        .eq("owner_type", "reel")
        .eq("owner_id", reelId)
        .select("id")
        .returns<{ id: string }[]>();
      if (error) return { ok: false, error: t.reels.form.errors.saveFailed };
      if (!data?.[0]) return { ok: false, error: t.memes.share.errors.notFound };
      revalidateReel(reelId);
      return { ok: true };
    },
  );
}
