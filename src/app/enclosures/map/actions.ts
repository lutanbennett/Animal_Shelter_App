"use server";

import { runAction, type ActionResult } from "@/lib/action-result";
import { loadEnclosureDetails, type EnclosureDetails } from "@/lib/enclosures/details";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { createClient } from "@/lib/supabase/server";

export type EnclosureDetailsResult = ActionResult<{ details: EnclosureDetails }>;

/**
 * One enclosure's details for the facility map's panel, loaded when it is tapped: the map itself
 * carries only counts. The same permission and the same loader as the enclosure page, so a tap shows
 * no more than opening the page would (a volunteer: who and where only, 0134). A read, not a write.
 */
export async function loadEnclosurePanel(id: string): Promise<EnclosureDetailsResult> {
  const { t } = await getT();
  return runAction<{ details: EnclosureDetails }>("facilityMap.loadEnclosurePanel", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "facility.enclosures", "read")) return { ok: false, error: t.enclosures.map.detailsNotAllowed };
    const details = await loadEnclosureDetails(await createClient(), id);
    if (!details) return { ok: false, error: t.enclosures.map.detailsNotFound };
    return { ok: true, details };
  });
}
