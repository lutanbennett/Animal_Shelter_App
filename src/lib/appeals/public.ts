import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { PublicTranslations } from "@/lib/translations/types";
import type { Locale } from "@/lib/i18n/locales";
import { localizedField } from "@/lib/translations/localize";
import type { AppealProgress, AppealStatus } from "./state";

/**
 * What the public site reads about sponsorship drives: public_appeals and
 * public_appeal_photos (0210) and nothing else. Those views carry the raised
 * figure as a SUM of gifts designated to the appeal and never a donor; the
 * cover and the photo list already leave out Medical-folder files. A page that
 * wanted another field would have to join a table anon cannot read, and that
 * is the design saying no.
 */

export type PublicAppeal = {
  id: string;
  resident_id: string;
  resident_name: string;
  resident_thai_name: string | null;
  species: string | null;
  title: string;
  what_is_wrong: string | null;
  treatment_needed: string | null;
  cost_covers: string | null;
  target_amount: number;
  raised_amount: number;
  raised_as_of: string | null;
  deadline: string | null;
  status: Exclude<AppealStatus, "draft">;
  outcome_note: string | null;
  display_style: "bar" | "thermometer" | "gauge";
  social_links: string[];
  cover_drive_file_id: string | null;
  cover_is_graphic: boolean;
  /** True when the cover is a Medical-folder photo (0216): the share preview must not use it. */
  cover_is_medical: boolean;
  published_at: string | null;
  closed_at: string | null;
  translations: PublicTranslations;
};

export type PublicAppealPhoto = {
  id: string;
  appeal_id: string;
  drive_file_id: string;
  position: number;
  is_cover: boolean;
  is_graphic: boolean;
  is_medical: boolean;
};

const APPEAL_COLUMNS =
  "id, resident_id, resident_name, resident_thai_name, species, title, what_is_wrong, treatment_needed, cost_covers, target_amount, raised_amount, raised_as_of, deadline, status, outcome_note, display_style, social_links, cover_drive_file_id, cover_is_graphic, cover_is_medical, published_at, closed_at, translations";

/** numeric columns can arrive as strings; the page does arithmetic on them. */
function normalise(row: PublicAppeal): PublicAppeal {
  return { ...row, target_amount: Number(row.target_amount), raised_amount: Number(row.raised_amount) };
}

/**
 * Every published appeal. A failed read throws rather than looking like "no
 * appeals" (docs/decisions/2026-10-11-silent-empty-reads.md).
 */
export async function loadPublicAppeals(supabase: SupabaseClient): Promise<PublicAppeal[]> {
  const { data, error } = await supabase
    .from("public_appeals")
    .select(APPEAL_COLUMNS)
    .order("published_at", { ascending: false })
    .returns<PublicAppeal[]>();
  if (error) throw new Error(`Appeals: could not read the appeals: ${error.message}`);
  return (data ?? []).map(normalise);
}

export async function loadPublicAppeal(supabase: SupabaseClient, id: string): Promise<PublicAppeal | null> {
  // A malformed id is a 404, not a database error.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const { data, error } = await supabase
    .from("public_appeals")
    .select(APPEAL_COLUMNS)
    .eq("id", id)
    .limit(1)
    .returns<PublicAppeal[]>();
  if (error) throw new Error(`Appeals: could not read the appeal: ${error.message}`);
  return data?.[0] ? normalise(data[0]) : null;
}

export async function loadPublicAppealPhotos(
  supabase: SupabaseClient,
  appealId: string,
): Promise<PublicAppealPhoto[]> {
  const { data, error } = await supabase
    .from("public_appeal_photos")
    .select("id, appeal_id, drive_file_id, position, is_cover, is_graphic, is_medical")
    .eq("appeal_id", appealId)
    .returns<PublicAppealPhoto[]>();
  if (error) throw new Error(`Appeals: could not read the photos: ${error.message}`);
  // The cover leads, then the order staff chose.
  return (data ?? []).sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position);
}

/**
 * The live appeal for one resident, if any: what the resident's page links to
 * in place of the placeholder sponsor line. A failed read reads as none, so
 * the resident page never goes down for a side feature.
 */
export async function loadLiveAppealForResident(
  supabase: SupabaseClient,
  residentId: string,
): Promise<PublicAppeal | null> {
  const { data, error } = await supabase
    .from("public_appeals")
    .select(APPEAL_COLUMNS)
    .eq("resident_id", residentId)
    .eq("status", "live")
    .order("published_at", { ascending: false })
    .limit(1)
    .returns<PublicAppeal[]>();
  if (error || !data?.[0]) return null;
  return normalise(data[0]);
}

/**
 * Whether any appeal is live, for the header's entry. Cached per request so
 * every header on one page shares the one query; a failed query reads as
 * "none" so the header never takes the page down.
 */
export const hasLiveAppeals = cache(async () => {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("public_appeals")
    .select("id", { count: "exact", head: true })
    .eq("status", "live");
  return !error && (count ?? 0) > 0;
});

export function appealText(locale: Locale, appeal: PublicAppeal) {
  const f = (original: string | null, column: string) =>
    localizedField(locale, original, appeal.translations, column);
  const thai = appeal.resident_thai_name?.trim();
  return {
    title: f(appeal.title, "title"),
    whatIsWrong: f(appeal.what_is_wrong, "what_is_wrong"),
    treatmentNeeded: f(appeal.treatment_needed, "treatment_needed"),
    costCovers: f(appeal.cost_covers, "cost_covers"),
    outcomeNote: f(appeal.outcome_note, "outcome_note"),
    residentName: locale === "th" && thai ? thai : appeal.resident_name,
  };
}

export function appealProgress(appeal: PublicAppeal): AppealProgress {
  return {
    raised: appeal.raised_amount,
    target: appeal.target_amount,
    status: appeal.status,
    deadline: appeal.deadline,
  };
}
