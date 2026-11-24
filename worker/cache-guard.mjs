// Whether the edge cache may serve or store a page for this request (#wbcch).
//
// The effective website state is the MORE CLOSED of the deployment floor (env.PUBLIC_SITE, one value for the whole
// Worker) and the shelter's own setting (x-public-site, worker/shelter.mjs). Only "open" may be cached: a holding page
// stored while the site was shut would otherwise be served for up to the cache TTL after it opened. The comparison is
// publicSiteStateFor() itself, so the app and this guard cannot disagree about which is more closed.
import { publicSiteStateFor } from "../src/lib/public-site.ts";

export function siteIsOpenForCache(request, env) {
  return publicSiteStateFor(request.headers.get("x-public-site"), env?.PUBLIC_SITE) === "open";
}
