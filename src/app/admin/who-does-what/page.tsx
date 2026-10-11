import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refuseFor } from "@/lib/auth/require-role";
import { loadPermissions } from "@/lib/permissions/load";
import { ACTIVITIES, type ActivityKey } from "@/lib/permissions/catalogue";
import { FIXED_FOR_NOW, fixedFor, type FixedEntry } from "@/lib/permissions/fixed-for-now";
import { unmetFor } from "@/lib/permissions/prerequisites";
import { TWO_STEP_PATH, hasTwoStep } from "@/lib/auth/two-step";
import { opensWhoDoesWhat } from "@/lib/permissions/who-does-what";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { toCsv } from "@/lib/csv";
import { CsvDownloadButton } from "@/components/CsvDownloadButton";
import { PrintButton } from "@/components/PrintButton";
import { CellSelect } from "./CellSelect";

/**
 * Settings → Who does what: every activity down the side, grouped by area, every live role across the
 * top, and what the role's box says. Admin changes a box here, behind the authenticator-app step; Management
 * sees the same grid and cannot change it (actions.ts holds the rules on the server).
 * docs/decisions/2026-10-11-who-does-what-view.md
 *
 * It is a demo surface, so it must be true. The boxes are read live from role_permissions (the same
 * table has_permission() and can() read, so the page cannot drift from the setting), and every box the
 * system does not yet obey is marked from FIXED_FOR_NOW, which scripts/check-who-does-what.mjs measures
 * against the database. A box that is neither true nor marked is that script's failure, not a matter
 * of taste.
 *
 * roles and role_permissions are readable by Admin alone (0132, 0153), and Management opens this page
 * too, so the two tables are read with the service role after the guard. Nothing in them is secret:
 * it is the shelter's own role settings, which these two may see by the backlog item.
 */
type Role = { key: string; name: string; nameTh: string | null; kind: string };

/** Management first (the Director by day); the doctor last, whose column the clinic rule decides; the rest by kind, then name. */
function columnOrder(a: Role, b: Role): number {
  const rank = (r: Role) => (r.key === "management" ? 0 : r.key === "doctor" ? 3 : r.kind === "custom" ? 1 : 2);
  return rank(a) - rank(b) || a.name.localeCompare(b.name);
}

function roleName(role: Role, t: Dictionary, locale: string): string {
  if (locale !== "th") return role.name;
  return role.nameTh ?? (t.admin.security.roles as Record<string, string>)[role.key] ?? role.name;
}

export default async function WhoDoesWhatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const perms = await loadPermissions();
  if (!opensWhoDoesWhat(perms)) refuseFor(perms);

  const { t, locale } = await getT();
  const w = t.admin.whoDoesWhat;
  // Only an Admin edits, and only in a session verified with the authenticator app (§6 rule 3).
  const isAdmin = !!perms?.isAdmin;
  const canEdit = isAdmin && (await hasTwoStep());

  const admin = createAdminClient();
  const [{ data: roleRows, error: rolesError }, { data: cellRows, error: cellsError }] = await Promise.all([
    admin.from("roles").select("id, key, name, name_th, kind").is("archived_at", null).eq("opens_app", true).neq("key", "admin"),
    admin.from("role_permissions").select("role_id, activity, level"),
  ]);
  if (rolesError || cellsError) throw new Error(`Who does what: ${(rolesError ?? cellsError)?.message}`);

  const idToKey = new Map((roleRows ?? []).map((r) => [r.id as string, r.key as string]));
  const roles: Role[] = (roleRows ?? [])
    .map((r) => ({ key: r.key as string, name: r.name as string, nameTh: (r.name_th as string | null) ?? null, kind: r.kind as string }))
    .sort(columnOrder);
  const cells = new Map<string, number>();
  for (const c of cellRows ?? []) {
    const key = idToKey.get(c.role_id as string);
    if (key) cells.set(`${key}|${c.activity}`, Number(c.level));
  }

  // Areas in the order the catalogue first reaches them; activities by their sort within each.
  const areas: { area: string; activities: (typeof ACTIVITIES)[number][] }[] = [];
  for (const a of [...ACTIVITIES].sort((x, y) => x.sort - y.sort)) {
    const group = areas.find((g) => g.area === a.area);
    if (group) group.activities.push(a);
    else areas.push({ area: a.area, activities: [a] });
  }

  // Boxes set to a combination the system cannot honour (prerequisites.ts), named rather than shown as if true.
  const unmet = roles.flatMap((r) =>
    ACTIVITIES.flatMap((a) => unmetFor((k) => cells.get(`${r.key}|${k}`) ?? 0, a.key).map((p) => ({ role: r.key, activity: a.key, id: p.id }))),
  );
  const isUnmet = (role: string, activity: string) => unmet.some((u) => u.role === role && u.activity === activity);

  const shown = FIXED_FOR_NOW.filter((e) => e.shown);
  const record = FIXED_FOR_NOW.filter((e) => !e.shown);
  const footnote = (e: FixedEntry) => shown.indexOf(e) + 1;
  const names = new Map(roles.map((r) => [r.key, roleName(r, t, locale)]));
  const affects = (e: FixedEntry) =>
    w.fixedAffects(roles.filter((r) => e.boxes[r.key]?.length).map((r) => names.get(r.key)).join(", "));

  const word = (kind: string, level: number) =>
    kind === "yesno" ? (level >= 2 ? w.levels.yes : w.levels.no) : level >= 2 ? w.levels.edit : level === 1 ? w.levels.read : w.levels.none;
  const areaName = (area: string) => (w.areas as Record<string, string>)[area] ?? area;
  const activityName = (key: ActivityKey) => w.activities[key];

  const csv = toCsv([
    [w.csvArea, w.activityHeading, w.adminName, ...roles.map((r) => names.get(r.key) ?? r.key)],
    ...areas.flatMap(({ area, activities }) =>
      activities.map((a) => [
        areaName(area),
        activityName(a.key),
        w.adminNote,
        ...roles.map((r) => {
          const marks = fixedFor(r.key, a.key).filter((e) => e.shown);
          const level = word(a.kind, cells.get(`${r.key}|${a.key}`) ?? 0);
          return marks.length ? `${level} (${w.csvFixed(marks.map((e) => w.fixed[e.id].title).join("; "))})` : level;
        }),
      ]),
    ),
  ]);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 print:p-0">
      {/* Printing: the page alone, landscape, the whole grid with no scroll box. */}
      <style>{`@media print {
  header, nav { display: none !important; }
  @page { size: landscape; margin: 10mm; }
  .wdw-scroll { overflow: visible !important; }
  .wdw-grid { font-size: 8pt; min-width: 0 !important; }
  .wdw-grid th, .wdw-grid td { position: static !important; padding: 2px 4px !important; }
  .wdw-grid tr { break-inside: avoid; }
}`}</style>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">{w.title}</h1>
          <p className="max-w-3xl text-sm text-muted [overflow-wrap:anywhere]">{w.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <CsvDownloadButton csv={csv} filename={`${w.csvFilename}.csv`} label={w.downloadCsv} />
          <PrintButton label={w.print} />
        </div>
      </div>

      <section className="rounded-lg border border-border bg-surface p-4">
        <p className="text-base font-semibold text-foreground">
          {w.adminName}: <span className="font-normal">{w.adminNote}</span>
        </p>
      </section>

      {isAdmin && (
        <div className="flex flex-col gap-1 text-sm print:hidden">
          <p className="text-foreground [overflow-wrap:anywhere]">{w.edit.intro}</p>
          {!canEdit && (
            <p className="text-foreground">
              {w.edit.verifyPrompt}{" "}
              <Link href={TWO_STEP_PATH} className="font-medium text-primary underline">
                {w.edit.verifyLink}
              </Link>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1 text-sm text-muted">
        <p className="[overflow-wrap:anywhere]">{w.legend}</p>
        <p className="[overflow-wrap:anywhere]">
          <FixedMark n="#" label={w.fixedTag} /> {w.fixedLegend}
        </p>
        <p className="md:hidden print:hidden">{w.scrollHint}</p>
      </div>

      <div className="wdw-scroll overflow-x-auto rounded-lg border border-border">
        <table className="wdw-grid w-full min-w-[60rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th scope="col" className="sticky left-0 z-10 w-36 bg-surface px-3 py-2 text-left font-semibold sm:w-64 text-foreground">
                {w.activityHeading}
              </th>
              {roles.map((r) => (
                <th key={r.key} scope="col" className="px-2 py-2 text-center align-bottom font-semibold text-foreground">
                  {names.get(r.key)}
                </th>
              ))}
            </tr>
          </thead>
          {areas.map(({ area, activities }) => (
            <tbody key={area}>
              <tr className="border-b border-border bg-background">
                <th scope="colgroup" className="sticky left-0 z-10 bg-background px-3 pb-1 pt-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  {areaName(area)}
                </th>
                <td colSpan={roles.length} className="bg-background" />
              </tr>
              {activities.map((a) => (
                <tr key={a.key} className="border-b border-border last:border-b-0">
                  <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-2 text-left text-xs font-normal text-foreground [overflow-wrap:anywhere] sm:text-sm">
                    {activityName(a.key)}
                  </th>
                  {roles.map((r) => {
                    const level = cells.get(`${r.key}|${a.key}`) ?? 0;
                    const marks = fixedFor(r.key, a.key).filter((e) => e.shown);
                    const clinic = fixedFor(r.key, a.key).some((e) => e.id === "clinicRule");
                    const bad = isUnmet(r.key, a.key);
                    return (
                      <td
                        key={r.key}
                        className={`px-2 py-2 text-center ${marks.length || bad ? "bg-warning/10" : ""} ${
                          level >= 2 ? "font-semibold text-foreground" : level === 1 ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {canEdit && !clinic ? (
                          <CellSelect roleKey={r.key} activity={a.key} kind={a.kind} level={level} label={`${activityName(a.key)}: ${names.get(r.key)}`} />
                        ) : (
                          word(a.kind, level)
                        )}
                        {bad && <FixedMark n="!" label={w.edit.unmetHeading} href="#wdw-unmet" />}
                        {canEdit && clinic && <span className="block text-xs text-muted">{w.edit.locked}</span>}
                        {marks.map((e) => (
                          <FixedMark key={e.id} n={footnote(e)} label={`${w.fixedTag}: ${w.fixed[e.id].title}`} href={`#fixed-${e.id}`} />
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      {unmet.length > 0 && (
        <section id="wdw-unmet" aria-labelledby="wdw-unmet-h" className="flex scroll-mt-4 flex-col gap-2">
          <h2 id="wdw-unmet-h" className="text-lg font-semibold text-foreground">
            {w.edit.unmetHeading}
          </h2>
          <p className="text-sm text-muted [overflow-wrap:anywhere]">{w.edit.unmetIntro}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-foreground">
            {unmet.map((u) => (
              <li key={`${u.role}|${u.activity}`} className="[overflow-wrap:anywhere]">
                {w.edit.unmet[u.id](names.get(u.role) ?? u.role)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="wdw-fixed" className="flex flex-col gap-3">
        <h2 id="wdw-fixed" className="text-lg font-semibold text-foreground">
          {w.fixedHeading}
        </h2>
        <ol className="flex flex-col gap-3">
          {shown.map((e) => (
            <li key={e.id} id={`fixed-${e.id}`} className="flex scroll-mt-4 gap-3 text-sm">
              <FixedMark n={footnote(e)} label={w.fixedTag} />
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <p className="font-semibold text-foreground">{w.fixed[e.id].title}</p>
                <p className="text-foreground">{w.fixed[e.id].reason}</p>
                <p className="text-muted">{affects(e)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="wdw-rules" className="flex flex-col gap-2">
        <h2 id="wdw-rules" className="text-lg font-semibold text-foreground">
          {w.rulesHeading}
        </h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-foreground">
          {w.rules.map((rule) => (
            <li key={rule} className="[overflow-wrap:anywhere]">
              {rule}
            </li>
          ))}
        </ul>
      </section>

      {record.length > 0 && (
        <details className="text-sm">
          <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-foreground">{w.recordHeading}</summary>
          <p className="text-muted [overflow-wrap:anywhere]">{w.recordIntro}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {record.map((e) => (
              <li key={e.id} className="[overflow-wrap:anywhere]">
                <p className="font-semibold text-foreground">{w.fixed[e.id].title}</p>
                <p className="text-foreground">{w.fixed[e.id].reason}</p>
                <p className="text-muted">{affects(e)}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}

/** The footnote mark on a box that is fixed for now: a number, so it reads in black and white too. */
function FixedMark({ n, label, href }: { n: number | string; label: string; href?: string }) {
  const mark = (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-warning px-1 align-middle text-xs font-semibold text-foreground">
      {n}
    </span>
  );
  return href ? (
    <a href={href} aria-label={label} title={label} className="inline-block">
      {mark}
    </a>
  ) : (
    <span role="img" aria-label={label} title={label}>
      {mark}
    </span>
  );
}
