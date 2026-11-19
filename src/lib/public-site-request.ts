import "server-only";
import { headers } from "next/headers";
import { PUBLIC_SITE_HEADER, publicSiteStateFor, type PublicSiteState } from "@/lib/public-site";

/** This request's website state: the Worker's per-shelter header, never less closed than PUBLIC_SITE. Read per request. */
export async function getPublicSiteState(): Promise<PublicSiteState> {
  return publicSiteStateFor((await headers()).get(PUBLIC_SITE_HEADER));
}
