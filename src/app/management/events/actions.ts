"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, databaseFailure, type ActionRefusal, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { checkEvent, type EventFields, type EventProblem } from "@/lib/events/form";

/** The words runWriteAction() needs; the same three for every write here. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

/**
 * Staff actions for fundraising events (0312, 0314). Every one asks events.run first; RLS asks the same cell, so this
 * is the friendly refusal, not the protection. Results, never throws (src/lib/action-result.ts). The public pages are
 * rendered live, so revalidating only has to reach the staff pages and the approval queue.
 */

const refuse = (error: string): ActionRefusal => ({ ok: false, error });

function problemText(t: Dictionary, problem: EventProblem, line?: number) {
  const e = t.eventsAdmin.errors;
  return problem === "link" ? e.link((line ?? 0) + 1) : e[problem];
}

function revalidateEvent(id: string) {
  revalidatePath("/management/events");
  revalidatePath(`/management/events/${id}`);
  revalidatePath("/photos/approve");
  revalidatePath("/home", "layout");
}

async function allowed() {
  return can(await loadPermissions(), "events.run");
}

/** Creates an event. It starts unpublished: nothing is public until it is published. */
export async function createEvent(fields: EventFields, requestId: string): Promise<ActionResult<{ id: string }>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("events.create", write(t), { id: requestId, action: "events.create", db: supabase }, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const checked = checkEvent(fields);
    if (!checked.ok) return refuse(problemText(t, checked.problem, checked.line));

    const { data, error } = await supabase
      .from("fundraising_events")
      .insert({ ...checked.event, published: false })
      .select("id")
      .single<{ id: string }>();
    if (error) return databaseFailure("events.create", error, t.common);
    revalidateEvent(data.id);
    return { ok: true, id: data.id };
  });
}

/** Saves the words, dates, place, status and links. Cancelling an event takes it off the website in the same save. */
export async function saveEvent(id: string, fields: EventFields, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("events.save", write(t), { id: requestId, action: "events.save", db: supabase }, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const checked = checkEvent(fields);
    if (!checked.ok) return refuse(problemText(t, checked.problem, checked.line));

    // fundraising_events_cancelled_not_published: the two columns cannot disagree, so cancelling unpublishes.
    const changes = checked.event.status === "cancelled" ? { ...checked.event, published: false } : checked.event;
    const { data, error } = await supabase.from("fundraising_events").update(changes).eq("id", id).select("id").maybeSingle<{ id: string }>();
    if (error) return databaseFailure("events.save", error, t.common);
    if (!data) return refuse(t.eventsAdmin.errors.notFound);
    revalidateEvent(id);
    return { ok: true };
  });
}

/** Puts the event on the website, or takes it off. A cancelled event is never published. */
export async function setEventPublished(id: string, published: boolean, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("events.publish", write(t), { id: requestId, action: "events.publish", db: supabase }, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const { data: row } = await supabase.from("fundraising_events").select("status").eq("id", id).maybeSingle<{ status: string }>();
    if (!row) return refuse(t.eventsAdmin.errors.notFound);
    if (published && row.status === "cancelled") return refuse(t.eventsAdmin.errors.cancelledNotPublished);
    const { error } = await supabase.from("fundraising_events").update({ published }).eq("id", id);
    if (error) return databaseFailure("events.publish", error, t.common);
    revalidateEvent(id);
    return { ok: true };
  });
}

/** Makes one photo the cover, or clears the cover. A meme is never the cover. */
export async function setEventCover(eventId: string, photoId: string | null, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("events.cover", write(t), { id: requestId, action: "events.cover", db: supabase }, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    if (photoId) {
      const { data: photo } = await supabase
        .from("fundraising_event_photos")
        .select("is_meme")
        .eq("id", photoId)
        .eq("event_id", eventId)
        .maybeSingle<{ is_meme: boolean }>();
      if (!photo) return refuse(t.eventsAdmin.errors.photoNotFound);
      if (photo.is_meme) return refuse(t.eventsAdmin.errors.memeNotCover);
    }
    // One cover per event is a unique index (0312): clear before setting.
    const cleared = await supabase.from("fundraising_event_photos").update({ is_cover: false }).eq("event_id", eventId).eq("is_cover", true);
    if (cleared.error) return databaseFailure("events.cover", cleared.error, t.common);
    if (photoId) {
      const { error } = await supabase.from("fundraising_event_photos").update({ is_cover: true }).eq("id", photoId).eq("event_id", eventId);
      if (error) return databaseFailure("events.cover", error, t.common);
    }
    revalidateEvent(eventId);
    return { ok: true };
  });
}

/** Marks a photo as a meme (shown as one, never the cover) or back to an ordinary photo. */
export async function setEventPhotoMeme(eventId: string, photoId: string, isMeme: boolean, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("events.meme", write(t), { id: requestId, action: "events.meme", db: supabase }, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const changes = isMeme ? { is_meme: true, is_cover: false } : { is_meme: false };
    const { data, error } = await supabase
      .from("fundraising_event_photos")
      .update(changes)
      .eq("id", photoId)
      .eq("event_id", eventId)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) return databaseFailure("events.meme", error, t.common);
    if (!data) return refuse(t.eventsAdmin.errors.photoNotFound);
    revalidateEvent(eventId);
    return { ok: true };
  });
}

/**
 * Removes a photo from the event: the attachment goes first (the gallery row cascades from it), then the Drive file is
 * trashed (Drive keeps it 30 days). If Drive fails the photo is already gone from the app, never the other way round.
 */
export async function removeEventPhoto(eventId: string, photoId: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("events.removePhoto", write(t), { id: requestId, action: "events.removePhoto", db: supabase }, async () => {
    if (!(await allowed())) return refuse(t.common.notAllowed);
    const { data: photo } = await supabase
      .from("fundraising_event_photos")
      .select("attachment_id, attachments(drive_file_id)")
      .eq("id", photoId)
      .eq("event_id", eventId)
      .maybeSingle<{ attachment_id: string; attachments: { drive_file_id: string } | null }>();
    if (!photo) return refuse(t.eventsAdmin.errors.photoNotFound);

    const { error } = await supabase.from("attachments").delete().eq("id", photo.attachment_id).eq("owner_type", "event");
    if (error) return databaseFailure("events.removePhoto", error, t.common);
    if (photo.attachments?.drive_file_id) {
      try {
        await getDriveClient().trashFile(photo.attachments.drive_file_id);
      } catch {
        // The photo is gone from the app; a stray file in the event's Drive folder is the lesser fault.
      }
    }
    revalidateEvent(eventId);
    return { ok: true };
  });
}
