import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicTranslations } from "@/lib/translations/types";
import type { Locale } from "@/lib/i18n/locales";
import { localizedField } from "@/lib/translations/localize";

/**
 * What the public site reads about fundraising events: public_fundraising_events and
 * public_fundraising_event_photos (0314) and nothing else. The views leave out an unpublished
 * or cancelled event and any photo not yet approved; no money figure and no creator is in them.
 */
export type PublicEvent = {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  status: "planned" | "held";
  social_links: string[];
  appeal_id: string | null;
  project_folder_id: string | null;
  cover_drive_file_id: string | null;
  translations: PublicTranslations;
};

export type PublicEventPhoto = { id: string; event_id: string; drive_file_id: string; position: number; is_cover: boolean; is_meme: boolean };

const COLUMNS =
  "id, title, summary, description, event_date, end_date, location, status, social_links, appeal_id, project_folder_id, cover_drive_file_id, translations";

/** Every public event, newest first. A failed read throws rather than looking like "no events". */
export async function loadPublicEvents(supabase: SupabaseClient): Promise<PublicEvent[]> {
  const { data, error } = await supabase
    .from("public_fundraising_events")
    .select(COLUMNS)
    .order("event_date", { ascending: false })
    .returns<PublicEvent[]>();
  if (error) throw new Error(`Events: could not read the events: ${error.message}`);
  return data ?? [];
}

export async function loadPublicEvent(supabase: SupabaseClient, id: string): Promise<PublicEvent | null> {
  // A malformed id is a 404, not a database error.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const { data, error } = await supabase.from("public_fundraising_events").select(COLUMNS).eq("id", id).limit(1).returns<PublicEvent[]>();
  if (error) throw new Error(`Events: could not read the event: ${error.message}`);
  return data?.[0] ?? null;
}

export async function loadPublicEventPhotos(supabase: SupabaseClient, eventId: string): Promise<PublicEventPhoto[]> {
  const { data, error } = await supabase
    .from("public_fundraising_event_photos")
    .select("id, event_id, drive_file_id, position, is_cover, is_meme")
    .eq("event_id", eventId)
    .order("position", { ascending: true })
    .returns<PublicEventPhoto[]>();
  if (error) throw new Error(`Events: could not read the photos: ${error.message}`);
  return data ?? [];
}

export function eventText(locale: Locale, e: PublicEvent) {
  const f = (original: string | null, column: string) => localizedField(locale, original, e.translations, column);
  return { title: f(e.title, "title"), summary: f(e.summary, "summary"), description: f(e.description, "description"), location: f(e.location, "location") };
}
