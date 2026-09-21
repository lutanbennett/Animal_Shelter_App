import {
  Ambulance,
  ArrowRightLeft,
  BookUser,
  Building2,
  CalendarClock,
  Camera,
  Droplet,
  Fence,
  HeartCrack,
  HeartHandshake,
  HeartPlus,
  HeartPulse,
  House,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  MessageCircleMore,
  MessageSquare,
  Navigation,
  PawPrint,
  Phone,
  PhoneCall,
  Pill,
  RotateCcw,
  Scissors,
  Stethoscope,
  Syringe,
  Undo2,
  Users,
  UserRound,
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
  // Not a PlacementActionKey: recording a death is reached from the hub's
  // resident details card, not the Housing card's action row, so it never
  // appears in availablePlacementActions().
  deceased: HeartCrack,
  // Withdrawing a death recorded in error — reached from the deceased banner.
  deceasedInError: HeartPlus,
} satisfies Record<string, LucideIcon>;

/** Icons for the enclosure browser (`/enclosures`) and enclosure hub. */
export const ENCLOSURE_ICONS = {
  enclosure: Fence,
  zone: MapPin,
  residents: Users,
  maintenance: Wrench,
  move: PLACEMENT_ICONS.move,
} satisfies Record<string, LucideIcon>;

/**
 * Icons for the contact list (`/contacts`) and contact hub. The action
 * icons are the tap targets on a phone — call, LINE / Messenger / WhatsApp
 * chat, email, open in maps. Lucide has no brand marks, so the three chat
 * apps get three different speech-bubble shapes and rely on their labels.
 */
export const CONTACT_ICONS = {
  contact: BookUser,
  call: PhoneCall,
  line: MessageCircle,
  messenger: MessageSquare,
  whatsapp: MessageCircleMore,
  email: Mail,
  map: Navigation,
  address: MapPin,
  residents: PawPrint,
  inCare: HeartHandshake,
} satisfies Record<string, LucideIcon>;

/** Icons for the vet list (`/vets`) and vet hub. */
export const VET_ICONS = {
  vet: UserRound,
  clinic: Building2,
  contact: Phone,
  visits: Stethoscope,
  residents: PawPrint,
  upcoming: CalendarClock,
  procedures: SECTION_ICONS.procedures,
  bloodTests: SECTION_ICONS["blood-tests"],
  prescriptions: SECTION_ICONS.prescriptions,
} satisfies Record<string, LucideIcon>;
