import { getT } from "@/lib/i18n/get-t";
import { SiteBodyView } from "./SiteBodyView";

/**
 * A site_pages body rendered for the public pages in the visitor's language.
 * The rendering is SiteBodyView (client-safe, so the website editor's preview
 * can use it); this wrapper only looks up the one string it needs.
 */
export async function SiteBody(props: Omit<Parameters<typeof SiteBodyView>[0], "newTabLabel">) {
  const { t } = await getT();
  return <SiteBodyView {...props} newTabLabel={t.common.opensInNewTab} />;
}
