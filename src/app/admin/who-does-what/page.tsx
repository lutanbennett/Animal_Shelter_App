import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refuseFor } from "@/lib/auth/require-role";
import { loadPermissions } from "@/lib/permissions/load";
import { ACTIVITIES, type ActivityKey } from "@/lib/permissions/catalogue";
import { CARDS, CARD_KEYS, bundleOfCards, includedCards, isCardKey, type CardKey } from "@/lib/permissions/cards";
import { TWO_STEP_PATH, hasTwoStep } from "@/lib/auth/two-step";
import { opensWhoDoesWhat, WHO_DOES_WHAT_PATH } from "@/lib/permissions/who-does-what";
import { getT } from "@/lib/i18n/get-t";
import { AddExtraForm, CardButton } from "./CardControls";
import { CardBoard } from "./CardBoard";
import { loadRoles, roleName } from "./roles";

/**
 * Settings → Who does what: a role's cards. Each card is a tile on the person's home screen and the permissions
 * under it, so the Director gives "Residents" and not forty boxes. Tap a card to see exactly what it gives, in a
 * short list generated from src/lib/permissions/cards.ts (never typed by hand, so it cannot drift from the bundle).
 * The full 56-row grid is one tap away on /admin/who-does-what/details; it does not share this page.
 * docs/decisions/2026-10-14-who-does-what-cards-page.md
 *
 * The page changes how access is described and assigned, not who has what: role_permissions stays the table the
 * database checks, recomputed as the union of the cards and the extras by set_role_cards() (0194).
 * Admin gives and removes cards, behind the authenticator-app step; Management sees the same and cannot change it
 * (actions.ts holds the rules on the server). The tables are read with the service role after the guard (see roles.ts).
 */
export default async function WhoDoesWhatPage(props: { searchParams: Promise<{ role?: string; card?: string; lib?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const perms = await loadPermissions();
  if (!opensWhoDoesWhat(perms)) refuseFor(perms);

  const { t, locale } = await getT();
  const w = t.admin.whoDoesWhat;
  const c = w.cardsView;
  const isAdmin = !!perms?.isAdmin;
  const canEdit = isAdmin && (await hasTwoStep());

  const sp = await props.searchParams;
  const roles = await loadRoles();
  const role = roles.find((r) => r.key === sp.role) ?? roles[0];
  const names = new Map(roles.map((r) => [r.key, roleName(r, t, locale)]));

  const admin = createAdminClient();
  const [{ data: cardRows, error: cardsError }, { data: extraRows, error: extrasError }] = await Promise.all([
    admin.from("role_cards").select("card, position").eq("role_id", role?.id ?? "").order("position"),
    admin.from("role_extras").select("activity, level, why").eq("role_id", role?.id ?? ""),
  ]);
  if (cardsError || extrasError) throw new Error(`Who does what: ${(cardsError ?? extrasError)?.message}`);

  const held: CardKey[] = (cardRows ?? []).map((r) => r.card as string).filter(isCardKey);
  const library = CARD_KEYS.filter((k) => !held.includes(k));
  const label = (k: CardKey) => CARDS[k].label(t);
  const describe = (k: CardKey) => c.description[k];

  const tileOf = (k: CardKey) => ({
    key: k,
    label: label(k),
    description: describe(k),
    includes: CARDS[k].includes.map((x) => label(x)).join(", "),
    href: href({ card: k }) + "#card-detail",
  });

  const activityName = (key: ActivityKey) => w.activities[key];
  const kindOf = new Map(ACTIVITIES.map((a) => [a.key as string, a.kind]));
  const word = (kind: string | undefined, level: number) =>
    kind === "yesno" ? (level >= 2 ? w.levels.yes : w.levels.no) : level >= 2 ? w.levels.edit : level === 1 ? w.levels.read : w.levels.none;

  const cardParam = isCardKey(sp.card) ? sp.card : null;
  const href = (extra?: Record<string, string>) => {
    const q = new URLSearchParams({ role: role?.key ?? "", ...extra });
    return `${WHO_DOES_WHAT_PATH}?${q.toString()}`;
  };

  // "Also allowed" is what no held card gives. An extra a held card already covers stays stored (so removing that
  // card takes away only what it gave) but is not listed while the card covers it.
  const given = bundleOfCards(held);
  const extras = (extraRows ?? [])
    .map((e) => ({ activity: e.activity as ActivityKey, level: Number(e.level), why: e.why as string }))
    .filter((e) => {
      const have = given.get(e.activity);
      return !(have === "edit" || (have === "read" && e.level === 1));
    });
  const extraOptions = ACTIVITIES.filter((a) => !extras.some((e) => e.activity === a.key))
    .sort((x, y) => x.sort - y.sort)
    .map((a) => ({ key: a.key as string, label: activityName(a.key as ActivityKey), kind: a.kind }));

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">{w.title}</h1>
          <p className="max-w-3xl text-sm text-muted [overflow-wrap:anywhere]">{c.subtitle}</p>
        </div>
        <Link href={`${WHO_DOES_WHAT_PATH}/details`} className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-medium text-primary underline">
          {c.detailsLink}
        </Link>
      </div>

      <section className="rounded-lg border border-border bg-surface p-4">
        <p className="text-base font-semibold text-foreground">
          {w.adminName}: <span className="font-normal">{w.adminNote}</span>
        </p>
      </section>

      <div className="flex flex-col gap-1 text-sm">
        {!isAdmin && <p className="text-muted">{c.readOnly}</p>}
        {isAdmin && !canEdit && (
          <p className="text-foreground">
            {c.verifyPrompt}{" "}
            <Link href={TWO_STEP_PATH} className="font-medium text-primary underline">
              {c.verifyLink}
            </Link>
          </p>
        )}
      </div>

      <nav aria-label={c.pickRole} className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <Link
            key={r.key}
            href={`${WHO_DOES_WHAT_PATH}?role=${r.key}`}
            aria-current={r.key === role?.key ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium ${
              r.key === role?.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"
            }`}
          >
            {names.get(r.key)}
          </Link>
        ))}
      </nav>

      {role && cardParam && (
        <section id="card-detail" aria-labelledby="card-detail-h" className="flex scroll-mt-4 flex-col gap-3 rounded-lg border-2 border-primary bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 id="card-detail-h" className="text-lg font-semibold text-foreground [overflow-wrap:anywhere]">
              {label(cardParam)}
            </h2>
            <Link href={href()} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
              {c.close}
            </Link>
          </div>
          <p className="text-sm text-foreground [overflow-wrap:anywhere]">{describe(cardParam)}</p>
          {CARDS[cardParam].includes.length > 0 && (
            <p className="text-sm text-foreground">
              {c.includes}:{" "}
              {includedCards(cardParam).map((k, i) => (
                <span key={k}>
                  {i > 0 && ", "}
                  <Link href={href({ card: k })} className="font-medium text-primary underline">
                    {label(k)}
                  </Link>
                </span>
              ))}
            </p>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">{c.gives}</p>
            <p className="text-xs text-muted">{c.givesNote}</p>
            <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm text-foreground">
              {CARDS[cardParam].bundle.map((b) => (
                <li key={b.activity} className="[overflow-wrap:anywhere]">
                  {activityName(b.activity)}: <span className="font-semibold">{word(kindOf.get(b.activity), b.level === "read" ? 1 : 2)}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-muted">{held.includes(cardParam) ? c.has : c.notHas}</p>
          {canEdit &&
            (held.includes(cardParam) ? (
              <CardButton op={{ kind: "remove", roleKey: role.key, card: cardParam }} label={c.remove} ariaLabel={c.removeFor(label(cardParam))} danger />
            ) : (
              <CardButton op={{ kind: "add", roleKey: role.key, card: cardParam }} label={c.add} ariaLabel={c.addFor(label(cardParam))} />
            ))}
        </section>
      )}

      {role && (
        <CardBoard
          roleKey={role.key}
          roleName={names.get(role.key) ?? role.key}
          canEdit={canEdit}
          held={held.map(tileOf)}
          library={library.map(tileOf)}
        />
      )}

      {role && (
        <section aria-labelledby="also-h" className="flex flex-col gap-3">
          <h2 id="also-h" className="text-lg font-semibold text-foreground">
            {c.alsoHeading}
          </h2>
          <p className="text-sm text-muted [overflow-wrap:anywhere]">{c.alsoIntro}</p>
          {extras.length === 0 ? (
            <p className="text-sm text-foreground">{c.noExtras}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {extras
                .sort((a, b) => (ACTIVITIES.find((x) => x.key === a.activity)?.sort ?? 0) - (ACTIVITIES.find((x) => x.key === b.activity)?.sort ?? 0))
                .map((e) => (
                  <li key={e.activity} className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3 text-sm">
                    <span className="font-semibold text-foreground [overflow-wrap:anywhere]">
                      {activityName(e.activity)}: {word(kindOf.get(e.activity), e.level)}
                    </span>
                    <span className="text-muted [overflow-wrap:anywhere]">
                      {c.extraWhy}: {e.why}
                    </span>
                    {canEdit && (
                      <div>
                        <CardButton op={{ kind: "removeExtra", roleKey: role.key, activity: e.activity }} label={c.extraRemove} ariaLabel={c.extraRemoveFor(activityName(e.activity))} danger />
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}
          {canEdit && extraOptions.length > 0 && (
            <details className="text-sm">
              <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-foreground">{c.extraAddHeading}</summary>
              <AddExtraForm roleKey={role.key} options={extraOptions} />
            </details>
          )}
        </section>
      )}

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
    </main>
  );
}
