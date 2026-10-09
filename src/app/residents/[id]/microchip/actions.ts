"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { microchipRefusal, readMicrochip } from "@/lib/residents/microchip";

/**
 * Adds, corrects or clears one resident's chip through
 * set_resident_microchip() (0116), the one write path a vet has: vets read
 * residents in their clinic's scope but hold no update on the table. Staff
 * and admin use it too from the hub, so there is one form and one set of
 * messages wherever a chip is recorded outside Edit resident and intake.
 *
 * The function strips nothing and overwrites both columns with what it is
 * given, so this strips first (readMicrochip) and always sends the number
 * and the date together: sending only a number would wipe the implant date.
 * Its refusals come back as SQLSTATEs and are mapped to words here.
 */
export async function setResidentMicrochip(
  residentId: string,
  formData: FormData,
): Promise<ActionResult<{ cleared: boolean }>> {
  const { t } = await getT();
  const e = t.residents.hub.chipForm.errors;
  return runAction<{ cleared: boolean }>("residents.setResidentMicrochip", t.common.somethingWentWrong, async () => {
    const chip = readMicrochip(formData);
    if ("invalid" in chip) return { ok: false, error: e.invalid };
    if (chip.microchip_implanted_on && chip.microchip_implanted_on > todayIso()) {
      return { ok: false, error: e.implantedInFuture };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("set_resident_microchip", {
      p_resident_id: residentId,
      p_number: chip.microchip_number,
      // Clearing the number removes the chip, date and all: a date left
      // behind would describe no chip, and come back prefilled next time.
      p_implanted_on: chip.microchip_number === null ? null : chip.microchip_implanted_on,
    });
    if (error) {
      const refusal = microchipRefusal(error);
      if (!refusal) throw error;
      return { ok: false, error: e[refusal] };
    }

    // The hub, its sections, and the vet-visit views all show the chip.
    revalidatePath(`/residents/${residentId}`, "layout");
    revalidatePath("/clinic-visits", "layout");
    revalidatePath("/appointments");
    return { ok: true, cleared: chip.microchip_number === null };
  });
}
