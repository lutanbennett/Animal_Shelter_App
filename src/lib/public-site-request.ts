import "server-only";
import { headers } from "next/headers";
import { PUBLIC_SITE_HEADER, publicSiteStateFor, type PublicSiteState } from "@/lib/public-site";

/** This request's website state: the Worker's per-shelter header, never less closed than PUBLIC_SITE. Read per request. */
export async function getPublicSiteState(): Promise<PublicSiteState> {
  return publicSiteStateFor((await headers()).get(PUBLIC_SITE_HEADER));
}

/** The Worker marks a request for a closed (archived) shelter, 0428. A closed shelter has no rows and no website; this only lets the pages say so. */
export async function isShelterClosed(): Promise<boolean> {
  return (await headers()).get("x-shelter-archived") === "1";
}
