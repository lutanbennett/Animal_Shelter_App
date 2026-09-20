import {
  Ambulance,
  ArrowRightLeft,
  Camera,
  Droplet,
  Fence,
  HeartHandshake,
  HeartPulse,
  House,
  Info,
  MapPin,
  Pill,
  RotateCcw,
  Scissors,
  Stethoscope,
  Syringe,
  Undo2,
  Users,
  Weight,
  Wrench,
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

/**
 * Icons for the placement actions (move, send to / return from hospital,
 * foster / adopt, return to shelter) wherever they appear: hub cards,
 * section pages and the action pages' own headings. Keyed by
 * PlacementActionKey (src/lib/placements/available.ts). The hospital and
 * rehome icons also stand in for the Housing card while a resident is in
 * hospital or with a carer, since they're off-site rather than in an
 * enclosure.
 */
export const PLACEMENT_ICONS = {
  move: ArrowRightLeft,
  hospital: Ambulance,
  hospitalReturn: Undo2,
  rehome: HeartHandshake,
  returnToShelter: RotateCcw,
} satisfies Record<string, LucideIcon>;

/** Icons for the enclosure browser (`/enclosures`) and enclosure hub. */
export const ENCLOSURE_ICONS = {
  enclosure: Fence,
  zone: MapPin,
  residents: Users,
  maintenance: Wrench,
  move: PLACEMENT_ICONS.move,
} satisfies Record<string, LucideIcon>;
