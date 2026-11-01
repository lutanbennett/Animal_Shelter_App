"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runWriteAction, type ActionRefusal, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { rehomeResident, type RehomeKind } from "@/lib/placements/rehome";

export type RehomeState = ActionRefusal | undefined;

/** The words runWriteAction() needs. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Records a Foster or Adopt placement from the hub's foster / adopt page.
 * The rules (roles, carer, date, current status) live in the shared
 * helper. Bound to the resident id.
 */
export async function rehome(
  residentId: string,
  _state: RehomeState,
  formData: FormData,
): Promise<RehomeState> {
  const { t } = await getT();
  const supabase = await createClient();
  // PI FAILOVER (D): the success path REDIRECTS, and a redirect throws, which would leave the claim open and
  // make a replay read "we cannot tell". So the body returns where to go, the result is stored, and the
  // redirect happens after runWriteAction() has finished the claim.
  const done = await runWriteAction<{ redirectTo: string }>(
    "residents.rehome",
    write(t),
    { id: writeRequestIdFrom(formData), action: "residents.rehome", db: supabase },
    async () => {

      // The carer picker posts either an existing contact id or the fields for
      // a new one, and says which with carerMode.
      const newCarer =
        str(formData, "carerMode") === "new"
          ? {
              name: str(formData, "newCarerName") ?? "",
              phone: str(formData, "newCarerPhone"),
              email: str(formData, "newCarerEmail"),
              lineId: str(formData, "newCarerLineId"),
            }
          : null;

      const result = await rehomeResident(supabase, t, {
        residentId,
        kind: (str(formData, "kind") ?? "") as RehomeKind,
        carerId: newCarer ? null : str(formData, "carerId"),
        newCarer,
        date: str(formData, "date") ?? "",
        notes: str(formData, "notes"),
      });
      if ("error" in result) return { ok: false, error: result.error };

      revalidatePath("/residents");
      revalidatePath(`/residents/${residentId}`);
      revalidatePath(`/residents/${residentId}/housing`);
      // Occupancy on the enclosure browser and both enclosure hubs changes too.
      revalidatePath("/enclosures", "layout");
      // The animal drops off the public adoption pages and the home page's
      // counts; without this the Adopt page kept listing it (F-20).
      revalidatePath("/adopt", "layout");
      revalidatePath("/");
      return { ok: true, redirectTo: `/residents/${residentId}` };
    },
  );
  if (done.ok) redirect(done.redirectTo);
  return done;
}
