import type { LucideIcon } from "lucide-react";
import type { ActivityKey } from "@/lib/permissions/catalogue";
import type { CardKey } from "@/lib/permissions/cards";

/**
 * A screenshot under public/manual/. `src` is the path the <img> loads;
 * scripts/manual-screenshots.mjs writes the files from a signed-in browser,
 * so the caption should describe what the reader is looking at rather than
 * repeat the steps.
 */
export type ManualScreenshot = {
  src: string;
  alt: string;
  caption?: string;
  /** Phone-width capture: rendered narrower and centred. */
  mobile?: boolean;
};

export type ManualCallout = {
  kind: "tip" | "note" | "warning";
  text: string;
};

/** One task inside a section: a heading, the steps, and what it looks like. */
export type ManualTopic = {
  id: string;
  title: string;
  /**
   * The cards whose holders do this task, when a person has decided that and the activity cannot say. Wins over the
   * derivation. Left out for almost every topic: a topic that names an `activity` derives its cards from cards.ts
   * (for-topic.ts, `cardsOfTopic`), so a change to a card needs no edit here.
   */
  cards?: CardKey[];
  /**
   * The topic is for everyone who signs in, and says so. This is the one legitimate "no card"; a topic with no
   * `activity`, no `cards` and no `everyone` is *unassigned*: shown to everyone and marked, never hidden.
   */
  everyone?: true;
  /**
   * The topic is about something only Admin does (Settings → Security, Stocktaking…), which sits outside the card system:
   * no card grants it, so only Admin is shown it. A decided answer, the same as an activity no card grants, not a gap.
   */
  adminOnly?: true;
  /**
   * UNASSIGNED, WAITING FOR THE CARD REVIEW. The roles this topic used to be tagged with, kept only as the worklist for
   * whoever links it to a card (docs/decisions/2026-10-26-manual-by-card.md). Nothing reads it to decide who sees the
   * topic and it names no one's access.
   */
  awaitingCard?: string[];
  /**
   * The activity whose holders do this task (edit level unless `activityLevel` says read; the catalogue's key).
   * The topic's cards are the cards that grant it, so a role built later sees the right topics.
   * scripts/acceptance-matrix.mjs fails when it names an activity no card grants.
   */
  activity?: ActivityKey;
  /** "read" when the topic is for whoever can look at the activity, not only change it (Enclosures, Maintenance board…). */
  activityLevel?: "read";
  /** Where in the app it lives, e.g. "Residents → New resident (intake)". */
  path?: string;
  intro?: string;
  steps?: string[];
  screenshot?: ManualScreenshot;
  callouts?: ManualCallout[];
};

export type ManualSection = {
  id: string;
  title: string;
  icon: LucideIcon;
  intro: string;
  topics: ManualTopic[];
};

export type Manual = {
  title: string;
  subtitle: string;
  /** Free text shown under the title, e.g. "Draft 1 · September 2026". */
  version: string;
  /** The page's filter line, and the label on a topic outside the reader's cards. */
  filter: {
    showingMine: (count: number) => string;
    showEverything: string;
    findHint: string;
    showingEverything: string;
    showOnlyMine: string;
    notYours: string;
    unassigned: string;
    you: string;
  };
  sections: ManualSection[];
};
