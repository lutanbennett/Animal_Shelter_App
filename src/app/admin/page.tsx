import { redirect } from "next/navigation";

/**
 * Admin has no landing page of its own; the nav label opens the first thing
 * in the group. That used to be Security, which moved to the pinned footer
 * group in the nav on 2026-09-22 — so clicking Admin now opens Website, the
 * first page the group still lists.
 */
export default function AdminPage() {
  redirect("/admin/website");
}
