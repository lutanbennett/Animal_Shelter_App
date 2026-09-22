import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadPublicResident } from "@/lib/residents/public";
import { isUuid } from "@/lib/tags/links";

/**
 * The address on a resident's RFID card (src/lib/tags/links.ts): the
 * R-code, so the card never carries a database id. A raw UUID is accepted
 * too. Case-insensitive on the code — a hand-typed r-0043 should land as
 * well as a scan.
 *
 * Where it goes depends on who scanned it (docs/decisions.md, 2026-09-22):
 * a signed-in user gets the full hub; a visitor gets the resident's public
 * profile on /adopt if the resident is shown on the public site, and
 * otherwise the sign-in page, which brings them back here. The route is
 * therefore public (src/lib/public-paths.ts) and resolves the code with
 * the service-role client, because anonymous visitors can't read
 * `residents` — nothing but the id comes out of that lookup, and the id
 * only ever leads to a page that does its own access check.
 *
 * Temporary redirects throughout: browsers cache 308s, which would pin a
 * printed card to today's layout — and to whoever was signed in.
 */
export default async function ResidentTagPage(props: PageProps<"/r/[code]">) {
  const { code } = await props.params;
  const id = isUuid(code) ? code : await lookupByCode(code.toUpperCase());
  if (!id) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(`/residents/${id}`);

  if (await loadPublicResident(supabase, id)) redirect(`/adopt/${id}`);
  redirect(`/login?next=${encodeURIComponent(`/r/${code}`)}`);
}

async function lookupByCode(code: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("residents")
    .select("id")
    .eq("resident_code", code)
    .limit(1)
    .returns<{ id: string }[]>();
  return data?.[0]?.id ?? null;
}
