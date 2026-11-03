import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { runWriteAction, type ActionResult } from "@/lib/action-result";

/**
 * Every bills write goes through runWriteAction() (PI FAILOVER (D), 2026-11-01), which is what lets the Worker replay a
 * save the Pi did not clearly answer. A new write in a bills action file goes through this with its own action name.
 */
export async function wrapped<R extends object>(
  action: string,
  requestId: string | null,
  body: (t: Dictionary) => Promise<ActionResult<R>>,
): Promise<ActionResult<R>> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction<R>(
    action,
    {
      somethingWentWrong: t.common.somethingWentWrong,
      saveUnknown: t.common.saveUnknown,
      reloadToSave: t.common.reloadToSave,
    },
    { id: requestId, action, db: supabase },
    () => body(t),
  );
}
