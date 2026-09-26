import { PageLoader } from "@/components/PuppyLoader";

/**
 * Route-level loading UI for every page: the puppy at the laptop on the
 * public site, a small inline one in the staff app (PuppyLoader.tsx). One
 * file at the root rather than one per segment, so a new page gets it
 * without anyone remembering to.
 */
export default function Loading() {
  return <PageLoader />;
}
