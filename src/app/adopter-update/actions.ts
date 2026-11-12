"use server";

// write-requests: replay-safe -- the sender is a signed-in adopter with no staff card, so claim_write_request() has no
// staff identity to claim as; the daily cap below bounds a replay to the same handful of rows an honest second tap makes.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n/get-t";
import { loadAdopterScope } from "@/lib/adopter/scope";
import { ADOPTER_NOTE_MAX_CHARS, ADOPTER_DAILY_CAP } from "@/lib/adopter/limits";

export type AdopterSendResult = { ok: true; updateId: string } | { ok: false; error: string };

/**
 * An adopter sends words about one of their animals. The four steps of docs/decisions/2026-11-11-adoption-updates-schema.md:
 * verified email -> contact (loadAdopterScope), adopter_may_submit(contact, resident), insert with text_approval OMITTED
 * (NULL: not read for the website; naming a state needs text.approve), and the adopter reads their own rows afterwards,
 * never the public view. Service-role is used because an adopter login has no table access, after both checks above.
 */
export async function sendAdopterUpdate(residentId: string, words: string, withFiles = false): Promise<AdopterSendResult> {
  const { t } = await getT();
  const e = t.adopterUpdate.errors;
  const note = words.trim();
  if (!note && !withFiles) return { ok: false, error: e.empty };
  if (note.length > ADOPTER_NOTE_MAX_CHARS) return { ok: false, error: e.tooLong(ADOPTER_NOTE_MAX_CHARS) };

  const scope = await loadAdopterScope(await createClient());
  const mine = scope?.residents.find((r) => r.residentId === residentId);
  if (!scope || !mine) return { ok: false, error: e.notYours };

  const admin = createAdminClient();
  const { data: may, error: mayError } = await admin.rpc("adopter_may_submit", { p_contact_id: mine.contactId, p_resident_id: residentId });
  if (mayError) return { ok: false, error: t.common.somethingWentWrong("adopter-update") };
  if (may !== true) return { ok: false, error: e.notYours };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("adoption_updates")
    .select("id", { count: "exact", head: true })
    .eq("sender_contact_id", mine.contactId)
    .eq("channel", "app")
    .gte("created_at", since);
  if (countError) return { ok: false, error: t.common.somethingWentWrong("adopter-update") };
  if ((count ?? 0) >= ADOPTER_DAILY_CAP) return { ok: false, error: e.tooMany };

  // Today in Thailand (UTC+7), the shelter date.
  const receivedOn = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: created, error } = await admin.from("adoption_updates").insert({
    resident_id: residentId,
    received_on: receivedOn,
    sender_contact_id: mine.contactId,
    channel: "app",
    note: note || null,
    // text_approval is deliberately NOT named: NULL = not read yet, and it stays absent from public_adoption_updates.
  }).select("id").single<{ id: string }>();
  if (error || !created) return { ok: false, error: t.common.somethingWentWrong("adopter-update") };

  revalidatePath("/adopter-update");
  revalidatePath(`/residents/${residentId}/adoption-updates`);
  return { ok: true, updateId: created.id };
}
