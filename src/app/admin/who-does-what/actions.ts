"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionResult } from "@/lib/action-result";
import { hasAdminRole } from "@/lib/auth/require-admin";
import { hasTwoStep } from "@/lib/auth/two-step";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { ACTIVITIES, isActivityKey } from "@/lib/permissions/catalogue";
import { bundleJson, isCardKey, type CardKey } from "@/lib/permissions/cards";
import { checkChange } from "@/lib/permissions/prerequisites";
import { isGroupIconKey } from "@/lib/home/group-icons";

/**
 * Settings → Who does what: give a role a card, take one away, reorder them, and keep or drop its extras.
 * docs/decisions/2026-10-14-who-does-what-cards-page.md
 *
 * Every change goes through the one database call of 0194, set_role_cards(), handed the bundle cards.ts computes
 * (includes and all), which recomputes role_permissions as the union of the cards and the extras. It runs as the
 * admin's own session, so role_cards' and role_permissions' own rules (Admin, at the authenticator-app step) are the
 * enforcement and the change reaches audit_log through the tables' triggers. The checks here answer in words first and
 * hold the fixed rules of docs/roles-and-permissions.md §6 on the server, so a hand-made call fares no better than the page:
 *   Admin and the public viewer are not columns (the role must be an editable, live one);
 *   Admin is the only editor, with the authenticator app (so there is always someone able to edit).
 * has_permission(), the policies and can() are not touched: they read role_permissions, as before.
 */
type Supabase = Awaited<ReturnType<typeof createClient>>;
type Dict = Awaited<ReturnType<typeof getT>>["t"];

async function guard(t: Dict, roleKey: string): Promise<{ ok: false; error: string } | { ok: true; supabase: Supabase; roleId: string }> {
  const w = t.admin.whoDoesWhat.edit;
  if (!(await hasAdminRole())) return { ok: false, error: w.adminOnly };
  if (!(await hasTwoStep())) return { ok: false, error: w.twoStepRequired };
  const supabase = await createClient();
  const { data } = await supabase
    .from("roles")
    .select("id, kind, opens_app")
    .eq("key", roleKey)
    .is("archived_at", null)
    .limit(1)
    .returns<{ id: string; kind: string; opens_app: boolean }[]>();
  const role = data?.[0];
  // Admin and the public viewer are kind 'fixed': a rule, not a column (§6 rules 1 and 4).
  if (!role || role.kind === "fixed" || !role.opens_app) return { ok: false, error: w.noSuchRole };
  return { ok: true, supabase, roleId: role.id };
}

async function currentCards(supabase: Supabase, roleId: string): Promise<CardKey[] | null> {
  const { data, error } = await supabase
    .from("role_cards")
    .select("card, position")
    .eq("role_id", roleId)
    .order("position")
    .returns<{ card: string; position: number }[]>();
  if (error) return null;
  return (data ?? []).map((r) => r.card).filter(isCardKey);
}

/** Which group each held card sits in (0241); a card on the home directly is absent. */
async function cardGroups(supabase: Supabase, roleId: string): Promise<Map<CardKey, string> | null> {
  const { data, error } = await supabase
    .from("role_cards")
    .select("card, group_id")
    .eq("role_id", roleId)
    .returns<{ card: string; group_id: string | null }[]>();
  if (error) return null;
  return new Map((data ?? []).filter((r) => r.group_id && isCardKey(r.card)).map((r) => [r.card as CardKey, r.group_id as string]));
}

function done(): ActionResult {
  revalidatePath("/admin/who-does-what");
  revalidatePath("/admin/who-does-what/details");
  revalidatePath("/outreach");
  return { ok: true };
}

async function apply(supabase: Supabase, roleId: string, cards: CardKey[], where: string, t: Dict): Promise<ActionResult> {
  const { error } = await supabase.rpc("set_role_cards", { p_role: roleId, p_cards: cards, p_bundle: bundleJson(cards) });
  // The two photo-approver refusals (0221, 0222) are written for the person reading them; show them as they are. Any other
  // check failure keeps the generic words, so a constraint name never reaches the browser.
  if (error?.code === "23514" && /approve photos/i.test(error.message ?? "") && /^(Give a role|This is the last role)/.test(error.message ?? "")) {
    return { ok: false, error: error.message };
  }
  if (error) return databaseFailure(where, error, t.common);
  return { ok: true };
}

export async function addCard(roleKey: string, card: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.addCard", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    if (!isCardKey(card)) return { ok: false, error: t.common.somethingWentWrong("card") };
    const cards = await currentCards(g.supabase, g.roleId);
    if (!cards) return { ok: false, error: t.common.somethingWentWrong("cards") };
    if (cards.includes(card)) return { ok: false, error: t.admin.whoDoesWhat.cardsView.alreadyHas };
    // Extras the new card also gives are kept, not dropped: the page hides them while a card covers them, and they
    // are still there, so removing the card later takes away only what the card gave, never what was granted singly.
    const r = await apply(g.supabase, g.roleId, [...cards, card], "whoDoesWhat.addCard", t);
    return r.ok ? done() : r;
  });
}

export async function removeCard(roleKey: string, card: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.removeCard", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    const cards = await currentCards(g.supabase, g.roleId);
    if (!cards) return { ok: false, error: t.common.somethingWentWrong("cards") };
    if (!cards.includes(card as CardKey)) return done();
    // What another remaining card (or an extra) still gives stays: the bundle handed in is the union of the cards that remain.
    const r = await apply(g.supabase, g.roleId, cards.filter((c) => c !== card), "whoDoesWhat.removeCard", t);
    return r.ok ? done() : r;
  });
}

export async function moveCard(roleKey: string, card: string, direction: "up" | "down"): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.moveCard", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    const cards = await currentCards(g.supabase, g.roleId);
    if (!cards) return { ok: false, error: t.common.somethingWentWrong("cards") };
    const groupOf = await cardGroups(g.supabase, g.roleId);
    if (!groupOf) return { ok: false, error: t.common.somethingWentWrong("cards") };
    // Up and down move a card among its neighbours in the same place: on the home, or inside the same group. The swap
    // is still of two places in the one order the role keeps, so set_role_cards() sees the same kind of change as before.
    const i = cards.indexOf(card as CardKey);
    const same = (k: CardKey) => (groupOf.get(k) ?? null) === (groupOf.get(card as CardKey) ?? null);
    const step = direction === "up" ? -1 : 1;
    let j = i + step;
    while (j >= 0 && j < cards.length && !same(cards[j])) j += step;
    if (i < 0 || j < 0 || j >= cards.length) return done();
    [cards[i], cards[j]] = [cards[j], cards[i]];
    const r = await apply(g.supabase, g.roleId, cards, "whoDoesWhat.moveCard", t);
    return r.ok ? done() : r;
  });
}

/** Take away one extra: the role loses that activity unless a card gives it. */
export async function removeExtra(roleKey: string, activity: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.removeExtra", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    if (!isActivityKey(activity)) return { ok: false, error: t.common.somethingWentWrong("activity") };
    const cards = await currentCards(g.supabase, g.roleId);
    if (!cards) return { ok: false, error: t.common.somethingWentWrong("cards") };
    const { error } = await g.supabase.from("role_extras").delete().eq("role_id", g.roleId).eq("activity", activity);
    if (error) return databaseFailure("whoDoesWhat.removeExtra", error, t.common);
    const r = await apply(g.supabase, g.roleId, cards, "whoDoesWhat.removeExtra", t);
    return r.ok ? done() : r;
  });
}

/** Give one activity that no card gives, with the reason. A prerequisite (prerequisites.ts) must already hold. */
export async function addExtra(roleKey: string, activity: string, level: number, why: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.addExtra", t.common.somethingWentWrong, async () => {
    const w = t.admin.whoDoesWhat;
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    if (!isActivityKey(activity)) return { ok: false, error: t.common.somethingWentWrong("activity") };
    const kind = ACTIVITIES.find((a) => a.key === activity)?.kind;
    if (!(kind === "yesno" ? [2] : [1, 2]).includes(level)) return { ok: false, error: t.common.somethingWentWrong("level") };
    const reason = why.trim();
    if (!reason) return { ok: false, error: w.cardsView.extraWhyNeeded };
    const cards = await currentCards(g.supabase, g.roleId);
    if (!cards) return { ok: false, error: t.common.somethingWentWrong("cards") };

    const { data: cellRows, error: readError } = await g.supabase
      .from("role_permissions")
      .select("activity, level")
      .eq("role_id", g.roleId)
      .returns<{ activity: string; level: number }[]>();
    if (readError) return databaseFailure("whoDoesWhat.addExtra", readError, t.common);
    const cells = new Map((cellRows ?? []).map((c) => [c.activity, Number(c.level)]));
    const refusal = checkChange((a) => cells.get(a) ?? 0, activity, level);
    if (!refusal.ok) {
      const rule = refusal.rule;
      return { ok: false, error: refusal.kind === "needs" ? w.edit.needs[rule.id] : w.edit.neededBy[rule.id] };
    }

    const { error } = await g.supabase.from("role_extras").upsert({ role_id: g.roleId, activity, level, why: reason }, { onConflict: "role_id,activity" });
    if (error) return databaseFailure("whoDoesWhat.addExtra", error, t.common);
    const r = await apply(g.supabase, g.roleId, cards, "whoDoesWhat.addExtra", t);
    return r.ok ? done() : r;
  });
}

/*
 * Groups on a role's home (role_groups, 0241): a doorway tile that opens a page of the cards inside it.
 * docs/decisions/2026-10-21-tile-groups-app.md
 *
 * A GROUP GRANTS NOTHING, so none of these calls set_role_cards(): they write role_groups and role_cards.group_id only,
 * and role_permissions cannot change. Same rules as the cards (Admin, at the authenticator-app step), enforced again by
 * the tables' own policies, since these run as the admin's own session. The trigger of 0241 refuses a card put in another
 * role's group, so a hand-made call cannot cross roles either.
 */
type GroupRow = { id: string; position: number };

async function currentGroups(supabase: Supabase, roleId: string): Promise<GroupRow[] | null> {
  const { data, error } = await supabase
    .from("role_groups")
    .select("id, position")
    .eq("role_id", roleId)
    .order("position")
    .order("name")
    .returns<GroupRow[]>();
  return error ? null : (data ?? []);
}

export async function addGroup(roleKey: string, name: string, nameTh: string, icon: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.addGroup", t.common.somethingWentWrong, async () => {
    const c = t.admin.whoDoesWhat.groups;
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    const en = name.trim();
    const th = nameTh.trim();
    if (!en) return { ok: false, error: c.namesNeeded };
    if (!isGroupIconKey(icon)) return { ok: false, error: t.common.somethingWentWrong("icon") };
    const groups = await currentGroups(g.supabase, g.roleId);
    if (!groups) return { ok: false, error: t.common.somethingWentWrong("groups") };
    const position = groups.reduce((m, x) => Math.max(m, x.position + 1), 0);
    const { error } = await g.supabase.from("role_groups").insert({ role_id: g.roleId, name: en, name_th: th || null, icon, position });
    if (error?.code === "23505") return { ok: false, error: c.nameTaken };
    if (error) return databaseFailure("whoDoesWhat.addGroup", error, t.common);
    return done();
  });
}

/** Remove a group. Its cards go back onto the home (the foreign key's on delete set null); the role keeps every card. */
export async function removeGroup(roleKey: string, groupId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.removeGroup", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    const { error } = await g.supabase.from("role_groups").delete().eq("role_id", g.roleId).eq("id", groupId);
    if (error) return databaseFailure("whoDoesWhat.removeGroup", error, t.common);
    return done();
  });
}

export async function moveGroup(roleKey: string, groupId: string, direction: "up" | "down"): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.moveGroup", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    const groups = await currentGroups(g.supabase, g.roleId);
    if (!groups) return { ok: false, error: t.common.somethingWentWrong("groups") };
    const i = groups.findIndex((x) => x.id === groupId);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= groups.length) return done();
    [groups[i], groups[j]] = [groups[j], groups[i]];
    // Renumber from 0, so two seeded groups that shared a position (or a gap) end up in a clean order.
    for (const [position, x] of groups.entries()) {
      if (x.position === position) continue;
      const { error } = await g.supabase.from("role_groups").update({ position }).eq("id", x.id).eq("role_id", g.roleId);
      if (error) return databaseFailure("whoDoesWhat.moveGroup", error, t.common);
    }
    return done();
  });
}

/** Put a held card in a group, or back on the home (groupId null). Only where it shows changes; what it gives does not. */
export async function setCardGroup(roleKey: string, card: string, groupId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.setCardGroup", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    if (!isCardKey(card)) return { ok: false, error: t.common.somethingWentWrong("card") };
    if (groupId !== null) {
      const groups = await currentGroups(g.supabase, g.roleId);
      if (!groups) return { ok: false, error: t.common.somethingWentWrong("groups") };
      if (!groups.some((x) => x.id === groupId)) return { ok: false, error: t.admin.whoDoesWhat.edit.noSuchRole };
    }
    const { data, error } = await g.supabase
      .from("role_cards")
      .update({ group_id: groupId })
      .eq("role_id", g.roleId)
      .eq("card", card)
      .select("card");
    if (error) return databaseFailure("whoDoesWhat.setCardGroup", error, t.common);
    if (!data?.length) return { ok: false, error: t.admin.whoDoesWhat.groups.notHeld };
    return done();
  });
}

/**
 * Show the menu, yes or no, for one role (0247). The column is written by the admin's own session, so roles' own rules
 * (Admin at the authenticator-app step) enforce it and audit_roles logs the flip. guard() above refuses Admin and the
 * public viewer, which never lose the menu.
 */
export async function setShowMenu(roleKey: string, show: boolean): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.setShowMenu", t.common.somethingWentWrong, async () => {
    const g = await guard(t, roleKey);
    if (!g.ok) return g;
    const { error } = await g.supabase.from("roles").update({ show_menu: show }).eq("id", g.roleId);
    if (error) return databaseFailure("whoDoesWhat.setShowMenu", error, t.common);
    revalidatePath("/", "layout");
    return done();
  });
}

/*
 * Features (features and card_features, 0255): the areas the Available cards are sectioned by. Names, order and each
 * card's feature are DATA Admin edits; a card's feature is one mapping for every role, because it lives on the card, not
 * on a role. NONE of this grants or removes anything: role_cards and role_permissions are not touched.
 * docs/decisions/2026-10-24-who-does-what-features-app.md
 *
 * Admin at the authenticator-app step, as above; the tables' own policies enforce it again. "Not yet sorted" is a card with
 * no card_features row or a null feature_id, so deleting a feature (on delete set null) unsorts its cards and loses none.
 */
async function featureGuard(t: Dict): Promise<{ ok: false; error: string } | { ok: true; supabase: Supabase }> {
  const w = t.admin.whoDoesWhat.edit;
  if (!(await hasAdminRole())) return { ok: false, error: w.adminOnly };
  if (!(await hasTwoStep())) return { ok: false, error: w.twoStepRequired };
  return { ok: true, supabase: await createClient() };
}

type FeatureRow = { id: string; position: number };

async function currentFeatures(supabase: Supabase): Promise<FeatureRow[] | null> {
  const { data, error } = await supabase.from("features").select("id, position").order("position").order("name").returns<FeatureRow[]>();
  return error ? null : (data ?? []);
}

/** A stable handle from the English name; the table wants lower-case letters, digits and underscores, starting with a letter. */
function featureKey(name: string, taken: Set<string>): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  const start = /^[a-z]/.test(base) ? base : `feature_${base}`.replace(/_+$/, "");
  let key = start;
  for (let n = 2; taken.has(key); n++) key = `${start}_${n}`;
  return key;
}

export async function addFeature(name: string, nameTh: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.addFeature", t.common.somethingWentWrong, async () => {
    const c = t.admin.whoDoesWhat.features;
    const g = await featureGuard(t);
    if (!g.ok) return g;
    const en = name.trim();
    const th = nameTh.trim();
    if (!en) return { ok: false, error: c.namesNeeded };
    if (en.length > 80 || th.length > 80) return { ok: false, error: c.tooLong };
    const { data, error: readError } = await g.supabase.from("features").select("key, position").returns<{ key: string; position: number }[]>();
    if (readError) return databaseFailure("whoDoesWhat.addFeature", readError, t.common);
    const position = (data ?? []).reduce((m, x) => Math.max(m, x.position + 1), 1);
    const key = featureKey(en, new Set((data ?? []).map((x) => x.key)));
    const { error } = await g.supabase.from("features").insert({ key, name: en, name_th: th || null, position });
    if (error) return databaseFailure("whoDoesWhat.addFeature", error, t.common);
    return done();
  });
}

export async function renameFeature(id: string, name: string, nameTh: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.renameFeature", t.common.somethingWentWrong, async () => {
    const c = t.admin.whoDoesWhat.features;
    const g = await featureGuard(t);
    if (!g.ok) return g;
    const en = name.trim();
    const th = nameTh.trim();
    if (!en) return { ok: false, error: c.namesNeeded };
    if (en.length > 80 || th.length > 80) return { ok: false, error: c.tooLong };
    const { data, error } = await g.supabase.from("features").update({ name: en, name_th: th || null }).eq("id", id).select("id");
    if (error) return databaseFailure("whoDoesWhat.renameFeature", error, t.common);
    if (!data?.length) return { ok: false, error: c.notFound };
    return done();
  });
}

export async function moveFeature(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.moveFeature", t.common.somethingWentWrong, async () => {
    const g = await featureGuard(t);
    if (!g.ok) return g;
    const features = await currentFeatures(g.supabase);
    if (!features) return { ok: false, error: t.common.somethingWentWrong("features") };
    const i = features.findIndex((x) => x.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= features.length) return done();
    [features[i], features[j]] = [features[j], features[i]];
    // Renumber from 1, so a gap or two equal positions end up in a clean order.
    for (const [n, x] of features.entries()) {
      if (x.position === n + 1) continue;
      const { error } = await g.supabase.from("features").update({ position: n + 1 }).eq("id", x.id);
      if (error) return databaseFailure("whoDoesWhat.moveFeature", error, t.common);
    }
    return done();
  });
}

/** Delete a feature. Its cards become Not yet sorted (on delete set null): none is lost and no role's access changes. */
export async function removeFeature(id: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.removeFeature", t.common.somethingWentWrong, async () => {
    const g = await featureGuard(t);
    if (!g.ok) return g;
    const { error } = await g.supabase.from("features").delete().eq("id", id);
    if (error) return databaseFailure("whoDoesWhat.removeFeature", error, t.common);
    return done();
  });
}

/** Put a card under a feature, or back in Not yet sorted (featureId null). The one mapping is shared by every role. */
export async function setCardFeature(card: string, featureId: string | null): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("whoDoesWhat.setCardFeature", t.common.somethingWentWrong, async () => {
    const g = await featureGuard(t);
    if (!g.ok) return g;
    if (!isCardKey(card)) return { ok: false, error: t.common.somethingWentWrong("card") };
    const { error } = await g.supabase.from("card_features").upsert({ card, feature_id: featureId }, { onConflict: "card" });
    if (error) return databaseFailure("whoDoesWhat.setCardFeature", error, t.common);
    return done();
  });
}
