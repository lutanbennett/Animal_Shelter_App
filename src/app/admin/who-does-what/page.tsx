import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refuseFor } from "@/lib/auth/require-role";
import { loadPermissions } from "@/lib/permissions/load";
import { ACTIVITIES, type ActivityKey } from "@/lib/permissions/catalogue";
import { APPROVE_ACTIVITY, approverNames, needsApprover } from "@/lib/permissions/approvers";
import { CARDS, CARD_KEYS, isCardKey, type CardKey } from "@/lib/permissions/cards";
import { includedBy, loadCardGrants } from "@/lib/permissions/card-grants";
import { TWO_STEP_PATH, hasTwoStep } from "@/lib/auth/two-step";
import { opensWhoDoesWhat, WHO_DOES_WHAT_PATH } from "@/lib/permissions/who-does-what";
import { parsePermissions } from "@/lib/permissions/can";
import { isSubsumed, tileBlock } from "@/lib/home/tiles";
import { getT } from "@/lib/i18n/get-t";
import { CardButton, ShowMenuToggle } from "./CardControls";
import { CardBoard } from "./CardBoard";
import { FeaturesPanel } from "./FeaturesPanel";
import { loadRoles, roleName } from "./roles";

/**
 * Settings → Who does what: a role's cards. Each card is a tile on the person's home screen and the permissions
 * under it, so the Director gives "Residents" and not forty boxes. Tap a card to see exactly what it gives, in a
 * short list generated from src/lib/permissions/cards.ts (never typed by hand, so it cannot drift from the bundle).
 * The full 56-row grid is one tap away on /admin/who-does-what/details; it does not share this page.
 * docs/decisions/2026-10-14-who-does-what-cards-page.md
 *
 * The page changes how access is described and assigned, not who has what: role_permissions stays the table the
 * database checks, recomputed by the database as the union of the role's cards' grants (card_grants, 0257); what a card gives is read from there.
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
  const [grants, { data: cardRows, error: cardsError }, { data: roleRow }, { data: cellRows }, { data: groupRows, error: groupsError }, { data: featureRows, error: featuresError }, { data: cardFeatureRows, error: cardFeaturesError }] = await Promise.all([
    loadCardGrants(),
    admin.from("role_cards").select("card, position, group_id").eq("role_id", role?.id ?? "").order("position"),
    admin.from("roles").select("key, name, kind, opens_app, home_path, show_menu, scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails").eq("id", role?.id ?? "").maybeSingle(),
    admin.from("role_permissions").select("activity, level").eq("role_id", role?.id ?? ""),
    admin.from("role_groups").select("id, name, name_th, icon").eq("role_id", role?.id ?? "").order("position").order("name"),
    admin.from("features").select("id, name, name_th, position").order("position").order("name"),
    admin.from("card_features").select("card, feature_id"),
  ]);
  const loadError = cardsError ?? groupsError ?? featuresError ?? cardFeaturesError;
  if (loadError) throw new Error(`Who does what: ${loadError.message}`);
  // Features (0255): sections of the Available column. A card with no row, a null feature, or a feature that is gone is Not yet sorted.
  const features = (featureRows ?? []).map((x) => ({ id: x.id as string, name: x.name as string, nameTh: (x.name_th as string | null) ?? "", label: (locale === "th" && (x.name_th as string)) || (x.name as string) }));
  const featureIds = new Set(features.map((x) => x.id));
  const featureOf = new Map((cardFeatureRows ?? []).map((r) => [r.card as string, r.feature_id && featureIds.has(r.feature_id as string) ? (r.feature_id as string) : null]));
  // Groups on the role's home (0241): where a card shows, never what it gives.
  const groupOf = new Map((cardRows ?? []).map((r) => [r.card as string, (r.group_id as string | null) ?? null]));
  const groups = (groupRows ?? []).map((g) => ({ id: g.id as string, label: (locale === "th" && (g.name_th as string)) || (g.name as string), icon: g.icon as string }));

  // Who approves photos right now, asked as the database asks it (0222): live, not Admin, holding the activity.
  const { data: approverRows, error: approverError } = await admin
    .from("role_permissions")
    .select("activity, level, roles!inner(key, name, name_th, archived_at)")
    .eq("activity", APPROVE_ACTIVITY)
    .gte("level", 1)
    .returns<{ activity: string; level: number; roles: { key: string; name: string; name_th: string | null; archived_at: string | null } }[]>();
  if (approverError) throw new Error(`Who does what: ${approverError.message}`);
  const approvers = approverNames(
    (approverRows ?? []).map((x) => ({
      roleKey: x.roles.key,
      roleName: roleName({ key: x.roles.key, name: x.roles.name, nameTh: x.roles.name_th }, t, locale),
      archived: !!x.roles.archived_at,
      activity: x.activity,
      level: x.level,
    })),
  );

  const held: CardKey[] = (cardRows ?? []).map((r) => r.card as string).filter(isCardKey);
  // The home the role really gets: a held card draws a tile unless the person could not open its page, or another held
  // card (Residents) already stands for it. A card with neither is the one that silently shows nothing.
  const rolePerms = roleRow
    ? parsePermissions({
        role: { key: roleRow.key, name: roleRow.name, name_th: null, kind: roleRow.kind, opens_app: roleRow.opens_app, home_path: roleRow.home_path },
        is_admin: false,
        scopes: { residents: roleRow.scope_residents, clinical: roleRow.scope_clinical, contacts: roleRow.scope_contacts, photos: roleRow.scope_photos, sees_login_emails: roleRow.sees_login_emails },
        permissions: Object.fromEntries((cellRows ?? []).map((x) => [x.activity as string, x.level as number])),
      })
    : null;
  const noTile = (k: CardKey) => (rolePerms && !isSubsumed(k, held, rolePerms) ? tileBlock(k, rolePerms) : null);
  const stoodForBy = (k: CardKey) => (rolePerms && isSubsumed(k, held, rolePerms) ? held.find((o) => o !== k && includedBy(grants, o).includes(k)) : undefined);
  const library = CARD_KEYS.filter((k) => !held.includes(k)).reverse(); // newest cards are added last, so they lead
  const label = (k: CardKey) => CARDS[k].label(t);
  const describe = (k: CardKey) => c.description[k];

  const warningFor = (k: CardKey) => {
    const block = noTile(k);
    return block ? c.noTile(block.page, block.rule) : undefined;
  };

  const tileOf = (k: CardKey) => ({
    warn: held.includes(k) ? warningFor(k) : undefined,
    key: k,
    label: label(k),
    description: describe(k),
    includes: (grants.includes.get(k) ?? []).map((x) => label(x)).join(", "),
    href: href({ card: k }) + "#card-detail",
    blocked: needsApprover(k) && approvers.length === 0 ? c.needsApprover : undefined,
    group: groupOf.get(k) ?? null,
    feature: featureOf.get(k) ?? null,
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
          {(grants.includes.get(cardParam) ?? []).length > 0 && (
            <p className="text-sm text-foreground">
              {c.includes}:{" "}
              {includedBy(grants, cardParam).map((k, i) => (
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
              {(grants.own.get(cardParam) ?? []).map((b) => (
                <li key={b.activity} className="[overflow-wrap:anywhere]">
                  {activityName(b.activity)}: <span className="font-semibold">{word(kindOf.get(b.activity), b.level === "read" ? 1 : 2)}</span>
                </li>
              ))}
            </ul>
          </div>
          {(cardParam === "approve_photos" || needsApprover(cardParam)) && (
            <p className="text-sm text-foreground [overflow-wrap:anywhere]">
              {approvers.length > 0 ? c.approversNow(approvers.join(", ")) : c.noApproversNow}
            </p>
          )}
          <p className="text-sm text-muted">{held.includes(cardParam) ? c.has : c.notHas}</p>
          {held.includes(cardParam) && stoodForBy(cardParam) && (
            <p className="text-sm text-foreground">{c.shownAsPart(label(stoodForBy(cardParam)!))}</p>
          )}
          {held.includes(cardParam) && warningFor(cardParam) && <p role="alert" className="text-sm font-medium text-danger">{warningFor(cardParam)}</p>}
          {canEdit &&
            (held.includes(cardParam) ? (
              <CardButton op={{ kind: "remove", roleKey: role.key, card: cardParam }} label={c.remove} ariaLabel={c.removeFor(label(cardParam))} danger />
            ) : needsApprover(cardParam) && approvers.length === 0 ? (
              <p role="note" className="text-sm font-medium text-danger">{c.needsApprover}</p>
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
          locked={isAdmin && !canEdit}
          verifyHref={TWO_STEP_PATH}
          held={held.map(tileOf)}
          groups={groups}
          library={library.map(tileOf)}
          features={features.map((x) => ({ id: x.id, label: x.label }))}
        />
      )}

      <FeaturesPanel
        features={features}
        cards={CARD_KEYS.map((k) => ({ key: k, label: label(k), feature: featureOf.get(k) ?? null }))}
        canEdit={canEdit}
        locked={isAdmin && !canEdit}
      />

      {role && (
        <section aria-labelledby="menu-h" className="flex flex-col gap-3">
          <h2 id="menu-h" className="text-lg font-semibold text-foreground">
            {c.menuHeading}
          </h2>
          <p className="text-sm text-muted [overflow-wrap:anywhere]">{c.menuIntro}</p>
          <p className="text-sm text-foreground">{c.menuNow(roleRow?.show_menu !== false)}</p>
          {canEdit ? (
            <ShowMenuToggle roleKey={role.key} show={roleRow?.show_menu !== false} onLabel={c.menuOn} offLabel={c.menuOff} />
          ) : (
            isAdmin && <p className="text-xs text-muted">{c.menuLocked}</p>
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
