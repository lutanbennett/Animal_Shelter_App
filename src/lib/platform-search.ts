import "server-only";
import { headers } from "next/headers";
import { isPlatformHostname, requestHost } from "@/lib/site-hosts";

export { platformRobots, platformSitemap, PLATFORM_INDEXABLE } from "@/lib/platform-seo";

/** Whether this request is for the platform host (cooperjaidee.org). */
export async function onPlatformHost(): Promise<boolean> {
  const h = await headers();
  return isPlatformHostname(requestHost((n) => h.get(n)) ?? "");
}
