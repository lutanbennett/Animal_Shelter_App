"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionRefusal, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { checkAppeal, publishBlocker, type AppealFields, type AppealProblem } from "@/lib/appeals/form";

/**
 * Staff actions for sponsorship drives (0210). Every one asks appeal.run
 * first; RLS asks the same cell, so this is the friendly refusal, not the
 * protection. Moving gifts also asks donation.receipt, because it changes a
 * donation. Results, never throws (src/lib/action-result.ts).
 *
 * The public pages are rendered live and /appeals is not edge-cached, so
 * revalidating here only has to reach the staff pages and the pages that are
 * cached (home, the resident's /adopt page).
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;
const refuse = (error: string): ActionRefusal => ({ ok: false, error });

function problemText(t: Dictionary, problem: AppealProblem, line?: number) {
  const e = t.appealsAdmin.errors;
  return problem === "link" ? e.link((line ?? 0) + 1) : e[problem];
}

function revalidateAppeal(id: string, residentId?: string) {
  revalidatePath("/management/appeals");
  revalidatePath(`/management/appeals/${id}`);
  revalidatePath("/appeals");
  revalidatePath(`/appeals/${id}`);
  revalidatePath("/");
  if (residentId) {
    revalidatePath(`/adopt/${residentId}`);
    revalidatePath(`/residents/${residentId}`);
  }
}

async function allowed() {
  return can(await loadPermissions(), "appeal.run");
}

type Row = {
  id: string;
  resident_id: string;
  status: string;
  published: boolean;
  what_is_wrong: string | null;
  treatment_needed: string | null;
};
const ROW = "id, resident_id, status, published, what_is_wrong, treatment_needed";

async function loadRow(supabase: Supabase, id: string) {
  return supabase.from("appeals").select(ROW).eq("id", id).maybeSingle<Row>();
}

/** Creates a draft. Nothing is public until it is published. */
export async function createAppeal(fields: AppealFields): Promise<ActionResult<{ id: string }>> {
  const { t } = await getT();
  return runAction("appeals.create", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const checked = checkAppeal(fields);
    if (!checked.ok) return refuse(problemText(t, checked.problem, checked.line));

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appeals")
      .insert({ ...checked.appeal, status: "draft", published: false })
      .select("id, resident_id")
      .single<{ id: string; resident_id: string }>();
    if (error) return databaseFailure("appeals.create", error, t.common);
    revalidateAppeal(data.id, data.resident_id);
    return { ok: true, id: data.id };
  });
}

/** Saves the words, target, deadline, style and links. The resident never changes. */
export async function saveAppeal(id: string, fields: AppealFields): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("appeals.save", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const checked = checkAppeal(fields);
    if (!checked.ok) return refuse(problemText(t, checked.problem, checked.line));

    const supabase = await createClient();
    const changes: Partial<typeof checked.appeal> = { ...checked.appeal };
    delete changes.resident_id;
    const { data, error } = await supabase
      .from("appeals")
      .update(changes)
      .eq("id", id)
      .select("resident_id")
      .maybeSingle<{ resident_id: string }>();
    if (error) return databaseFailure("appeals.save", error, t.common);
    if (!data) return refuse(t.appealsAdmin.errors.notFound);
    revalidateAppeal(id, data.resident_id);
    return { ok: true };
  });
}

export type PhotoChoice = { attachmentId: string; isGraphic: boolean };

/**
 * Sets which of the resident's photos the appeal shows, in order, one of them
 * the cover. The database refuses a Medical-folder file, a file of another
 * resident and a non-image (appeal_photos_guard); this turns its refusal into
 * words. There is deliberately no way here to override that
 * (docs/decisions/2026-10-16-appeals-schema.md, point 3).
 */
export async function saveAppealPhotos(
  id: string,
  coverAttachmentId: string | null,
  photos: PhotoChoice[],
): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.appealsAdmin.errors;
  return runAction("appeals.photos", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const supabase = await createClient();
    const { data: row, error: rErr } = await loadRow(supabase, id);
    if (rErr) return databaseFailure("appeals.photos.load", rErr, t.common);
    if (!row) return refuse(e.notFound);

    const ids = photos.map((p) => p.attachmentId);
    if (new Set(ids).size !== ids.length) return refuse(e.photoOther);
    if (coverAttachmentId && !ids.includes(coverAttachmentId)) return refuse(e.photoOther);

    // Remove only what is no longer chosen, then upsert the rest, so a refused photo
    // leaves the appeal with the photos it already had rather than none.
    const { data: existing, error: xErr } = await supabase
      .from("appeal_photos")
      .select("attachment_id")
      .eq("appeal_id", id)
      .returns<{ attachment_id: string }[]>();
    if (xErr) return databaseFailure("appeals.photos.existing", xErr, t.common);
    const drop = (existing ?? []).map((x) => x.attachment_id).filter((a) => !ids.includes(a));
    if (drop.length > 0) {
      const { error } = await supabase.from("appeal_photos").delete().eq("appeal_id", id).in("attachment_id", drop);
      if (error) return databaseFailure("appeals.photos.drop", error, t.common);
    }
    // One cover only (a unique index): clear the old one before the new one is set.
    const { error: cErr } = await supabase
      .from("appeal_photos")
      .update({ is_cover: false })
      .eq("appeal_id", id)
      .eq("is_cover", true);
    if (cErr) return databaseFailure("appeals.photos.cover", cErr, t.common);

    if (photos.length > 0) {
      const { error } = await supabase.from("appeal_photos").upsert(
        photos.map((p, position) => ({
          appeal_id: id,
          attachment_id: p.attachmentId,
          position,
          is_cover: p.attachmentId === coverAttachmentId,
          is_graphic: p.isGraphic,
        })),
        { onConflict: "appeal_id,attachment_id" },
      );
      if (error) {
        if (/Medical/i.test(error.message ?? "")) return refuse(e.photoMedical);
        if (/own resident|image files/i.test(error.message ?? "")) return refuse(e.photoOther);
        return databaseFailure("appeals.photos.save", error, t.common);
      }
    }
    revalidateAppeal(id, row.resident_id);
    return { ok: true };
  });
}

export type AppealTransition = "publish" | "unpublish" | "fund" | "reopen";

/**
 * The status moves. publish: draft to live, on the website. unpublish: back to
 * a draft, off the website. fund: live to funded, still on the website but no
 * longer asking. reopen: funded to live. Closing has its own action because it
 * needs the outcome; a closed appeal does not reopen.
 */
export async function moveAppeal(id: string, move: AppealTransition): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.appealsAdmin.errors;
  return runAction("appeals.move", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const supabase = await createClient();
    const { data: row, error: rErr } = await loadRow(supabase, id);
    if (rErr) return databaseFailure("appeals.move.load", rErr, t.common);
    if (!row) return refuse(e.notFound);
    if (row.status === "closed") return refuse(e.alreadyClosed);

    let change: { status: string; published: boolean };
    if (move === "publish") {
      if (row.status !== "draft") return refuse(e.notDraft);
      if (publishBlocker(row)) return refuse(e.story);
      change = { status: "live", published: true };
    } else if (move === "unpublish") {
      change = { status: "draft", published: false };
    } else if (move === "fund") {
      if (row.status !== "live") return refuse(e.notLive);
      change = { status: "funded", published: true };
    } else {
      if (row.status !== "funded") return refuse(e.notFunded);
      change = { status: "live", published: true };
    }

    const { error } = await supabase.from("appeals").update(change).eq("id", id);
    if (error) return databaseFailure("appeals.move", error, t.common);
    revalidateAppeal(id, row.resident_id);
    return { ok: true };
  });
}

/**
 * Closes the appeal with how it went. From this moment the public page shows
 * the outcome and no ways to give, and the donation form refuses new gifts
 * for it. An appeal that was never published is deleted instead, not closed.
 */
export async function closeAppeal(id: string, outcome: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.appealsAdmin.errors;
  return runAction("appeals.close", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const note = outcome.trim();
    if (!note) return refuse(e.outcome);
    const supabase = await createClient();
    const { data: row, error: rErr } = await loadRow(supabase, id);
    if (rErr) return databaseFailure("appeals.close.load", rErr, t.common);
    if (!row) return refuse(e.notFound);
    if (row.status === "closed") return refuse(e.alreadyClosed);
    if (row.status === "draft") return refuse(e.closeDraft);

    const { error } = await supabase.from("appeals").update({ status: "closed", outcome_note: note }).eq("id", id);
    if (error) return databaseFailure("appeals.close", error, t.common);
    revalidateAppeal(id, row.resident_id);
    return { ok: true };
  });
}

/** Deletes a draft with no gifts. The database refuses one that has gifts (on delete restrict). */
export async function deleteDraftAppeal(id: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.appealsAdmin.errors;
  return runAction("appeals.delete", t.common.somethingWentWrong, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const supabase = await createClient();
    const { data: row, error: rErr } = await loadRow(supabase, id);
    if (rErr) return databaseFailure("appeals.delete.load", rErr, t.common);
    if (!row) return refuse(e.notFound);
    if (row.status !== "draft") return refuse(e.notDraft);
    const { error } = await supabase.from("appeals").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") return refuse(e.hasGifts);
      return databaseFailure("appeals.delete", error, t.common);
    }
    revalidateAppeal(id, row.resident_id);
    return { ok: true };
  });
}

/**
 * Moves gifts recorded "for the resident" onto the appeal, so they count
 * towards it. It is ONE UPDATE of the same donation rows, not a copy: a gift
 * has a single designation, so after the move it is on the appeal and no
 * longer on the resident, and cannot be counted in both places. Only gifts
 * designated to this appeal's own resident are touched; the filter is in the
 * statement, not just the form. Receipts are untouched (a receipt prints the
 * donor and the lines, never the designation). The change is in the audit log.
 */
export async function moveGiftsToAppeal(
  appealId: string,
  donationIds: string[],
): Promise<ActionResult<{ moved: number }>> {
  const { t } = await getT();
  const e = t.appealsAdmin.errors;
  return runAction("appeals.moveGifts", t.common.somethingWentWrong, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "appeal.run") || !can(perms, "donation.receipt")) return refuse(t.common.notAllowed);
    if (donationIds.length === 0) return refuse(e.nothingToMove);
    const supabase = await createClient();
    const { data: row, error: rErr } = await loadRow(supabase, appealId);
    if (rErr) return databaseFailure("appeals.moveGifts.load", rErr, t.common);
    if (!row) return refuse(e.notFound);
    if (row.status === "closed") return refuse(e.alreadyClosed);

    const { data, error } = await supabase
      .from("donations")
      .update({ designation: "appeal", designation_appeal_id: appealId, designation_resident_id: null })
      .in("id", donationIds)
      .eq("designation", "resident")
      .eq("designation_resident_id", row.resident_id)
      .select("id");
    if (error) return databaseFailure("appeals.moveGifts", error, t.common);
    const moved = data?.length ?? 0;
    if (moved === 0) return refuse(e.nothingToMove);
    revalidateAppeal(appealId, row.resident_id);
    revalidatePath("/management/donations");
    return { ok: true, moved };
  });
}

/**
 * The way back for a gift counted on an appeal by mistake: it returns to the
 * appeal's resident, and stops counting at once. Never deletes the gift.
 */
export async function moveGiftOutOfAppeal(appealId: string, donationId: string): Promise<ActionResult> {
  const { t } = await getT();
  const e = t.appealsAdmin.errors;
  return runAction("appeals.moveGiftOut", t.common.somethingWentWrong, async () => {
    const perms = await loadPermissions();
    if (!can(perms, "appeal.run") || !can(perms, "donation.receipt")) return refuse(t.common.notAllowed);
    const supabase = await createClient();
    const { data: row, error: rErr } = await loadRow(supabase, appealId);
    if (rErr) return databaseFailure("appeals.moveGiftOut.load", rErr, t.common);
    if (!row) return refuse(e.notFound);
    if (row.status === "closed") return refuse(e.alreadyClosed);

    const { data, error } = await supabase
      .from("donations")
      .update({ designation: "resident", designation_resident_id: row.resident_id, designation_appeal_id: null })
      .eq("id", donationId)
      .eq("designation", "appeal")
      .eq("designation_appeal_id", appealId)
      .select("id");
    if (error) return databaseFailure("appeals.moveGiftOut", error, t.common);
    if (!data || data.length === 0) return refuse(e.nothingToMove);
    revalidateAppeal(appealId, row.resident_id);
    revalidatePath("/management/donations");
    return { ok: true };
  });
}
