"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionResult } from "@/lib/action-result";
import { hasAdminRole } from "@/lib/auth/require-admin";
import { hasTwoStep } from "@/lib/auth/two-step";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { ACTIVITIES, isActivityKey } from "@/lib/permissions/catalogue";
import { bundleJson, bundleOfCards, isCardKey, type CardKey } from "@/lib/permissions/cards";
import { checkChange } from "@/lib/permissions/prerequisites";

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

function done(): ActionResult {
  revalidatePath("/admin/who-does-what");
  revalidatePath("/admin/who-does-what/details");
  revalidatePath("/outreach");
  return { ok: true };
}

async function apply(supabase: Supabase, roleId: string, cards: CardKey[], where: string, t: Dict): Promise<ActionResult> {
  const { error } = await supabase.rpc("set_role_cards", { p_role: roleId, p_cards: cards, p_bundle: bundleJson(cards) });
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
    const next = [...cards, card];
    const r = await apply(g.supabase, g.roleId, next, "whoDoesWhat.addCard", t);
    if (!r.ok) return r;

    // An extra the cards now fully give is redundant: drop it so "Also allowed" lists only what no card gives.
    // The recompute above already took the higher level of the two, so access does not change.
    const given = bundleOfCards(next);
    const { data: extras } = await g.supabase.from("role_extras").select("activity, level").eq("role_id", g.roleId).returns<{ activity: string; level: number }[]>();
    for (const e of extras ?? []) {
      const have = given.get(e.activity as never);
      if (have && (have === "edit" || Number(e.level) === 1)) {
        await g.supabase.from("role_extras").delete().eq("role_id", g.roleId).eq("activity", e.activity);
      }
    }
    return done();
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
    const i = cards.indexOf(card as CardKey);
    const j = direction === "up" ? i - 1 : i + 1;
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
