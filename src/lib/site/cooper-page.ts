import type { SupabaseClient } from "@supabase/supabase-js";
import { PRODUCT_COOPER_PAGE } from "@/lib/platform-features";
import { loadProductPage, type ProductPageContent } from "@/lib/site/product-content";

/**
 * Cooper's page (#cpstr). Its words and photo are the product administrator's, typed into /platform/content as page "cooper",
 * lines: `heading` (the page's title), `kicker` (optional small line above it), `story` (the words; a blank line starts a new
 * paragraph), `photo` (optional; the English line is its alt text) and `description` (optional; the search snippet, else the
 * start of the story). There is NO dictionary fallback and no placeholder on purpose: the page is live only when `heading`
 * has English text, and until then it answers not-found and stays out of the sitemap.
 */
export const COOPER_HEADING_KEY = "heading";

export function cooperHasContent(content: ProductPageContent): boolean {
  return !!content.get(COOPER_HEADING_KEY)?.en.trim();
}

export async function cooperIsLive(supabase: SupabaseClient): Promise<boolean> {
  return cooperHasContent(await loadProductPage(supabase, PRODUCT_COOPER_PAGE));
}

/** The story's paragraphs: blank-line separated, empties dropped. */
export function storyParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
