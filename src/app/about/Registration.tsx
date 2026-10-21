import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadSiteContent, pairedText } from "@/lib/site/content";

/** The registration line (0237) on the About page; nothing when it is blank. */
export async function Registration() {
  const { locale } = await getT();
  const site = await loadSiteContent(await createClient());
  const text = pairedText(locale, site?.registration_text, site?.registration_text_th);
  if (!text) return null;
  return <p className="whitespace-pre-line text-base font-semibold text-site-ink">{text}</p>;
}
