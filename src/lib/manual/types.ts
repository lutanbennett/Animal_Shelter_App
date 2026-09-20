import type { LucideIcon } from "lucide-react";

/** The app_role values, as the manual's "who can do this" badges name them. */
export type ManualRole = "admin" | "management" | "staff" | "vet" | "volunteer";

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
  sections: ManualSection[];
};
