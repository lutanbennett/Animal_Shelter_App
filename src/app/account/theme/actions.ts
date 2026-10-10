"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { THEMES, THEME_METADATA_KEY, type Theme } from "@/lib/theme/themes";

/**
 * The signed-in person saves their colour theme (src/lib/theme/themes.ts) to
 * their own user_metadata, through their own session — a preference, not a
 * permission, so no service role. updateUser merges into user_metadata, so
 * their name and anything else there is left alone. Saving the default
 * stores null, which removes the key rather than recording "dark".
 *
 * The picker has already switched the page; this makes it stick, on this
 * device's next load and on every other device.
 */
export async function setOwnTheme(theme: Theme): Promise<{ error: string } | { success: true }> {
  const { t } = await getT();
  if (!(THEMES as readonly string[]).includes(theme)) return { error: t.header.theme.failed };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.header.theme.failed };

  const { error } = await supabase.auth.updateUser({
    data: { [THEME_METADATA_KEY]: theme === "dark" ? null : theme },
  });
  if (error) {
    console.error("[account.setOwnTheme]", error);
    return { error: t.header.theme.failed };
  }
  // The attribute is set by the root layout, above every signed-in page.
  revalidatePath("/", "layout");
  return { success: true };
}
