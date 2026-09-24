import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addressMapEmbedSrc } from "@/lib/contacts/map-preview";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_FRIEND_COLUMNS, type PublicFriend } from "./friends";

/**
 * What the public site reads about Shelter Friends — public_shelter_friends
 * and nothing else. The view (0076) returns only published profiles of
 * live contacts, with each contact detail null unless its box was ticked,
 * and anon has no grant on shelter_friends or contacts at all. So a public
 * page that needed a field this file doesn't select would have to join
 * contacts to get it, and that is the design saying no.
 */

/** Every published Friend, in the order staff arranged them. */
export async function loadPublicFriends(
  supabase: SupabaseClient,
): Promise<{ friends: PublicFriend[]; error: string | null }> {
  const { data, error } = await supabase
    .from("public_shelter_friends")
    .select(PUBLIC_FRIEND_COLUMNS)
    .order("sort_order")
    .order("name")
    .returns<PublicFriend[]>();
  return { friends: data ?? [], error: error?.message ?? null };
}

/**
 * Whether there is any published Friend. The header and footer link to
 * /friends only when there is — a nav entry to an empty thank-you page is
 * worse than none, and none is the state the site starts in. Cached per
 * request so the header and footer on one page share the one query — and
 * so it takes no client argument: cache() keys on argument identity, and
 * each component makes its own client. A failed query reads as "none"
 * rather than taking the page down.
 */
export const hasPublicFriends = cache(async () => {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("public_shelter_friends")
    .select("id", { count: "exact", head: true });
  return !error && (count ?? 0) > 0;
});

/**
 * The map embed for each Friend that opted into one, keyed by id. Resolved
 * server-side like the contact hub's (a shared maps short link is followed
 * once); a pin that can't be built is simply left out.
 */
export async function friendMapSources(friends: PublicFriend[]) {
  const entries = await Promise.all(
    friends.map(async (f) => [f.id, await addressMapEmbedSrc(f.map_location)] as const),
  );
  return new Map(entries.filter((e): e is readonly [string, string] => e[1] !== null));
}
