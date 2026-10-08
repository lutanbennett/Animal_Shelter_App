import { redirect } from "next/navigation";

/**
 * The medication list moved to Shelter Operations (docs/decisions/2026-10-07-management-settings-split.md,
 * agreed 2026-10-08). This keeps old bookmarks working for one release cycle, carrying the round
 * and the view along.
 *
 * REMOVE in the clean-up of the release after the one that ships the move, and not before
 * 2026-10-15. Nothing in the app links here any more.
 */
export default async function OldMedicationListPage(props: PageProps<"/management/medication-list">) {
  const sp = await props.searchParams;
  const query = new URLSearchParams();
  for (const key of ["round", "view"] as const) {
    const value = sp[key];
    if (typeof value === "string") query.set(key, value);
  }
  const qs = query.toString();
  redirect(`/operations/medication-list${qs ? `?${qs}` : ""}`);
}
