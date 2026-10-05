import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { refuseFor } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { loadPermissions } from "@/lib/permissions/load";
import { can, type Permissions } from "@/lib/permissions/can";
import { ACTIVITIES, type ActivityKey } from "@/lib/permissions/catalogue";
import { loadRolePermissions } from "@/lib/home/roles";
import { homeTilesFor } from "@/lib/home/tiles";
import { cellsFor, type Draft } from "@/lib/roles-draft/resolve";
import draftFile from "@/lib/roles-draft/draft-1.json";
import { getT } from "@/lib/i18n/get-t";

/**
 * Settings → The Director's first draft, role by role. Admin only (the Director's own look at what
 * she asked for), and deliberately English-only: it is a review aid for one reader that goes away
 * when the draft is signed, not a page the shelter's people use, so its words are not in the
 * dictionaries. docs/decisions/2026-10-05-director-draft-roles.md says why.
 *
 * It reads the role's cells as the database holds them, not the draft file, so what it says is
 * what the role can really do on this site. The draft file supplies only the words (the sheet's
 * rows), the notes, and the marks that were not ticks. If the database does not hold the draft the
 * page says so at the top, so nobody judges a draft by a role that was never loaded.
 */
const draft = draftFile as unknown as Draft;
const KINDS = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.kind])) as Record<string, "level" | "yesno">;
const KEYS = new Set<string>(ACTIVITIES.map((a) => a.key));

/** Does this role hold every cell a sheet row stands for, at the level a tick means? */
function holds(perms: Permissions, row: Draft["rows"][number]): boolean {
  return (
    row.keys.length > 0 &&
    row.keys.every((k) =>
      k.level === "yes" ? can(perms, k.activity as never) : can(perms, k.activity as never, k.level === "read" ? "read" : "edit"),
    )
  );
}

export default async function RoleDraftPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const mine = await loadPermissions();
  if (!mine?.isAdmin) refuseFor(mine);

  const { t } = await getT();
  const roleKeys = Object.keys(draft.roles);
  const loaded = await Promise.all(roleKeys.map((k) => loadRolePermissions(supabase, k)));
  if (loaded.some((p) => !p)) notFound();

  const roles = roleKeys.map((key, i) => {
    const perms = loaded[i] as Permissions;
    const want = cellsFor(draft, key, KINDS);
    // The role holds exactly the draft's cells? Anything else means the loader has not been run here.
    const held = Object.entries(perms.cells).filter(([k]) => KEYS.has(k));
    const matches = held.length === want.length && want.every((c) => perms.cells[c.activity as ActivityKey] === c.level);
    return { key, perms, matches, def: draft.roles[key], tiles: homeTilesFor(perms, t) };
  });
  const allMatch = roles.every((r) => r.matches);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">The first draft, role by role</h1>
        <p className="text-sm text-muted [overflow-wrap:anywhere]">
          Your ticks from the sheet, shown as what each person can and cannot do. This is the test site only: nothing here is live for the shelter.
        </p>
      </div>

      <nav aria-label="Roles" className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <a
            key={r.key}
            href={`#${r.key}`}
            className="block min-h-11 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground [overflow-wrap:anywhere] hover:bg-surface-hover"
          >
            {r.def.label}
          </a>
        ))}
      </nav>

      {!allMatch && (
        <section role="alert" className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground">
          <p className="font-semibold">The draft is not loaded on this site.</p>
          <p className="text-muted">
            Below is what these roles can do today, which differs from the draft for: {roles.filter((r) => !r.matches).map((r) => r.def.label).join(", ")}.
          </p>
        </section>
      )}

      {roles.map((r) => {
        const can_ = draft.rows.filter((row) => holds(r.perms, row));
        const cannot = draft.rows.filter((row) => row.keys.length > 0 && !holds(r.perms, row));
        const marks = draft.unclear.filter((u) => u.role === r.key);
        return (
          <section key={r.key} id={r.key} className="flex min-w-0 scroll-mt-4 flex-col gap-4 rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold text-foreground [overflow-wrap:anywhere]">{r.def.label}</h2>
              <Link href={`/home/${r.key}`} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
                See their home screen
              </Link>
            </div>

            {r.def.notes && r.def.notes.length > 0 && (
              <ul className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm text-foreground">
                {r.def.notes.map((n) => (
                  <li key={n} className="[overflow-wrap:anywhere]">
                    {n}
                  </li>
                ))}
              </ul>
            )}

            <div>
              <h3 className="font-semibold text-foreground">Can do ({can_.length})</h3>
              {can_.length === 0 ? (
                <p className="text-sm text-muted">Nothing on the sheet.</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-1 text-sm text-foreground">
                  {can_.map((row) => (
                    <li key={row.row} className="flex gap-2 [overflow-wrap:anywhere]">
                      <span aria-hidden className="text-muted">
                        {row.row}
                      </span>
                      <span>{row.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {marks.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground">Marked, but not a tick (loaded as no)</h3>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-foreground">
                  {marks.map((m) => (
                    <li key={m.row} className="[overflow-wrap:anywhere]">
                      Row {m.row}, {draft.rows.find((x) => x.row === m.row)?.label}: {m.mark}.
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-foreground">Their home screen</h3>
              {r.tiles.length === 0 ? (
                <p className="text-sm text-muted">No tiles.</p>
              ) : (
                <ul className="mt-1 flex flex-wrap gap-2 text-sm">
                  {r.tiles.map((tile) => (
                    <li key={tile.href} className="rounded-full border border-border px-3 py-1.5 text-foreground [overflow-wrap:anywhere]">
                      {tile.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <details className="text-sm">
              <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-foreground">Cannot do ({cannot.length})</summary>
              <ul className="flex flex-col gap-1 text-muted">
                {cannot.map((row) => (
                  <li key={row.row} className="flex gap-2 [overflow-wrap:anywhere]">
                    <span aria-hidden>{row.row}</span>
                    <span>{row.label}</span>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        );
      })}
    </main>
  );
}
