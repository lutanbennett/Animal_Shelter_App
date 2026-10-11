import type { LucideIcon } from "lucide-react";
import type { ActivityKey } from "@/lib/permissions/catalogue";

/** The app_role values, as the manual's "who can do this" badges name them. */
export type ManualRole = "admin" | "management" | "doctor" | "volunteer";

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
  /** Roles that can perform this task; omitted = everyone who can sign in. */
  roles?: ManualRole[];
  /**
   * The activity whose holders do this task (edit level unless `activityLevel` says read; the catalogue's key).
   * The reader's "is this mine?" asks can() for it, so a role built later sees
   * the right topics; `roles` stays for the "Who:" badge, which names the six
   * roles that exist today, and scripts/acceptance-matrix.mjs fails when the
   * two disagree. Omit it where the topic is everyone's.
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
  roleNames: Record<ManualRole, string>;
  roleSummary: Record<ManualRole, string>;
  /**
   * The page's role filter: the line above the sections and the label on a
   * topic outside the reader's role. `role` is already the role's name.
   */
  filter: {
    showingRole: (role: string, count: number) => string;
    showEverything: string;
    findHint: string;
    showingEverything: (role: string) => string;
    showOnlyRole: (role: string) => string;
    notForRole: (role: string) => string;
    you: string;
  };
  sections: ManualSection[];
};
