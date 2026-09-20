import {
  Camera,
  Droplet,
  HeartPulse,
  House,
  Info,
  Pill,
  Scissors,
  Stethoscope,
  Syringe,
  Weight,
  type LucideIcon,
} from "lucide-react";

/**
 * One icon per resident-hub section, keyed by the `/residents/[id]/[section]`
 * slug so the hub cards and the section pages stay in sync.
 */
export const SECTION_ICONS = {
  housing: House,
  photos: Camera,
  immunizations: Syringe,
  "vet-appointments": Stethoscope,
  prescriptions: Pill,
  weight: Weight,
  procedures: Scissors,
  "blood-tests": Droplet,
} satisfies Record<string, LucideIcon>;

export type HubSection = keyof typeof SECTION_ICONS;

/** Icons for the mobile Overview / Medical tab switcher on the hub. */
export const HUB_TAB_ICONS = {
  info: Info,
  medical: HeartPulse,
} satisfies Record<string, LucideIcon>;
