import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StaffEvent = {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  status: "planned" | "held" | "cancelled";
  appeal_id: string | null;
  project_folder_id: string | null;
  social_links: string[];
  published: boolean;
};

export type StaffEventPhoto = {
  id: string;
  attachmentId: string;
  driveFileId: string;
  fileName: string | null;
  isCover: boolean;
  isMeme: boolean;
  /** attachments.approved_at: null while the photo waits in the approval queue. */
  approved: boolean;
};

const EVENT_COLUMNS = "id, title, summary, description, event_date, end_date, location, status, appeal_id, project_folder_id, social_links, published";

/** Newest event first. */
export async function loadStaffEvents(supabase: SupabaseClient): Promise<StaffEvent[]> {
  const { data, error } = await supabase
    .from("fundraising_events")
    .select(EVENT_COLUMNS)
    .order("event_date", { ascending: false })
    .returns<StaffEvent[]>();
  if (error) throw new Error(`Events: could not read the events: ${error.message}`);
  return data ?? [];
}

export async function loadStaffEvent(supabase: SupabaseClient, id: string): Promise<StaffEvent | null> {
  const { data, error } = await supabase.from("fundraising_events").select(EVENT_COLUMNS).eq("id", id).maybeSingle<StaffEvent>();
  if (error) throw new Error(`Events: could not read the event: ${error.message}`);
  return data;
}

/** How many photos each event has, for the list. */
export async function loadPhotoCounts(supabase: SupabaseClient, ids: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (ids.length === 0) return counts;
  const { data } = await supabase.from("fundraising_event_photos").select("event_id").in("event_id", ids).returns<{ event_id: string }[]>();
  for (const r of data ?? []) counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
  return counts;
}

type PhotoRow = {
  id: string;
  attachment_id: string;
  is_cover: boolean;
  is_meme: boolean;
  attachments: { drive_file_id: string; file_name: string | null; approved_at: string | null } | null;
};

export async function loadEventPhotos(supabase: SupabaseClient, eventId: string): Promise<StaffEventPhoto[]> {
  const { data, error } = await supabase
    .from("fundraising_event_photos")
    .select("id, attachment_id, is_cover, is_meme, attachments(drive_file_id, file_name, approved_at)")
    .eq("event_id", eventId)
    .order("position", { ascending: true })
    .returns<PhotoRow[]>();
  if (error) throw new Error(`Events: could not read the photos: ${error.message}`);
  return (data ?? []).flatMap((r) =>
    r.attachments
      ? [{
          id: r.id,
          attachmentId: r.attachment_id,
          driveFileId: r.attachments.drive_file_id,
          fileName: r.attachments.file_name,
          isCover: r.is_cover,
          isMeme: r.is_meme,
          approved: r.attachments.approved_at !== null,
        }]
      : [],
  );
}

/** The campaigns and project folders an event may link to, as far as this login can read them. */
export async function loadLinkChoices(supabase: SupabaseClient) {
  const [appeals, projects] = await Promise.all([
    supabase.from("appeals").select("id, title").order("created_at", { ascending: false }).returns<{ id: string; title: string }[]>(),
    supabase.from("project_folders").select("id, name").not("parent_folder_id", "is", null).order("name").returns<{ id: string; name: string }[]>(),
  ]);
  return { appeals: appeals.data ?? [], projects: projects.data ?? [] };
}
