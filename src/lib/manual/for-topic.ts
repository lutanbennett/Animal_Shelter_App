import { bundleOfCards, CARD_KEYS, type CardKey } from "@/lib/permissions/cards";
import { can, type Permissions } from "@/lib/permissions/can";
import type { LevelKey } from "@/lib/permissions/catalogue";
import type { ManualTopic } from "./types";

/**
 * Which cards a topic belongs to, and what "no card" means for it. The two meanings are kept apart on purpose:
 *  - `everyone`: the topic is meant for everyone who signs in, and says so (`everyone: true`). Legitimately no card.
 *  - `unassigned`: nobody has decided yet. It is SHOWN to everyone and marked, never hidden, so the gap is visible
 *    (a topic with no card treated as "not mine" would vanish for everybody with no message and no record).
 *  - `cards`: the topic is for whoever holds one of these.
 * A topic that names an `activity` is derived (and when no card grants it, only Admin does that thing, so only Admin is shown it): the cards whose bundle grants it, at the level it needs, read from
 * cards.ts, so when a card changes the answer changes with it and nothing in the manual is edited. An explicit `cards`
 * list on the topic wins over the derivation.
 */
export type TopicCards = { kind: "everyone" } | { kind: "unassigned" } | { kind: "cards"; cards: CardKey[] };

export function cardsOfTopic(topic: ManualTopic): TopicCards {
  if (topic.cards?.length) return { kind: "cards", cards: topic.cards };
  if (topic.activity) {
    const need = topic.activityLevel === "read" ? "read" : "edit";
    const cards = CARD_KEYS.filter((k) => {
      const level = bundleOfCards([k]).get(topic.activity!);
      return level !== undefined && (need === "read" || level === "edit");
    });
    // No card grants it: an Admin-only page (Settings…), outside the card system. That is a derived answer, not a gap, so it
    // is "cards" with none, which only Admin satisfies; it is not "unassigned", which is shown to everyone.
    return { kind: "cards", cards };
  }
  return topic.everyone ? { kind: "everyone" } : { kind: "unassigned" };
}

/**
 * Whether this login holds a card: Admin does (outside the card system, so it is never asked), anyone else when their
 * access covers everything the card grants. A card that grants nothing (a landing page) is held by no one here.
 */
export function holdsCard(perms: Permissions | null | undefined, key: CardKey): boolean {
  if (!perms) return false;
  if (perms.isAdmin) return true;
  const bundle = bundleOfCards([key]);
  return bundle.size > 0 && [...bundle].every(([activity, level]) => can(perms, activity as LevelKey, level));
}

export type TopicView = "mine" | "unassigned" | "notMine";

/**
 * How a topic stands for this reader. No permissions at all (not signed in as an app user) sees everything, as before.
 * Apart from the page because scripts/acceptance-matrix.mjs loads this file directly.
 */
export function topicView(topic: ManualTopic, perms: Permissions | null | undefined): TopicView {
  const own = cardsOfTopic(topic);
  if (own.kind === "unassigned") return "unassigned";
  if (!perms || perms.isAdmin || own.kind === "everyone") return "mine";
  return own.cards.some((k) => holdsCard(perms, k)) ? "mine" : "notMine";
}

/** Whether the copy shows it by default: the reader's own, and the unassigned, which are never hidden. */
export function isForTopic(topic: ManualTopic, perms: Permissions | null | undefined): boolean {
  return topicView(topic, perms) !== "notMine";
}
