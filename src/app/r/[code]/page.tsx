import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/tags/links";

/**
 * The address on a resident's RFID card (src/lib/tags/links.ts): the
 * R-code, looked up here so the card never carries a database id. A raw
 * UUID is accepted too so an older link keeps working. Case-insensitive
 * on the code — a hand-typed r-0043 should land as well as a scan.
 * Temporary redirect, as for /e/[id].
 */
export default async function ResidentTagPage(props: PageProps<"/r/[code]">) {
  const { code } = await props.params;
  if (isUuid(code)) redirect(`/residents/${code}`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("residents")
    .select("id")
    .eq("resident_code", code.toUpperCase())
    .limit(1)
    .returns<{ id: string }[]>();

  const resident = data?.[0];
  if (!resident) notFound();
  redirect(`/residents/${resident.id}`);
}
