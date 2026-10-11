import { redirect } from "next/navigation";

/**
 * The Director's draft review page is retired: the grid at Settings → Who does what now shows every role's
 * boxes as the database holds them and an Admin changes them there. This stays as a redirect, not a
 * deletion, because the Director's draft history and the "stays open" note in
 * docs/decisions/2026-10-06-director-draft-apply.md point here, and /home/[role] links to it. The draft
 * itself (src/lib/roles-draft/draft-2.json) is untouched and still what scripts/load-role-draft.mjs reads.
 * docs/decisions/2026-10-11-who-does-what-edit.md
 */
export default function RoleDraftRedirect() {
  redirect("/admin/who-does-what");
}
