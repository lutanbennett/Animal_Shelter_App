import {
  Ambulance,
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUp,
  BookOpen,
  BookUser,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarX2,
  Ban,
  Camera,
  Check,
  ClipboardCheck,
  ClipboardList,
  Copy,
  Droplet,
  Fence,
  Folder,
  Globe,
  GlobeLock,
  ImageOff,
  ImageUp,
  HeartCrack,
  HeartHandshake,
  HeartPlus,
  HeartPulse,
  House,
  Info,
  KeyRound,
  Link2,
  ListTodo,
  Mail,
  Map as MapIcon,
  MapPin,
  Merge,
  MessageCircle,
  MessageCircleHeart,
  MessageCircleMore,
  MessageSquare,
  Navigation,
  Newspaper,
  Pause,
  PawPrint,
  Phone,
  Repeat,
  PhoneCall,
  Pencil,
  Pill,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Scissors,
  Settings,
  Funnel,
  Save,
  Send,
  ShieldCheck,
  ShieldOff,
  Star,
  Stethoscope,
  Syringe,
  Trash2,
  Truck,
  Undo2,
  Unlink,
  Users,
  UserCheck,
  UserMinus,
  UserRound,
  Utensils,
  Weight,
  Wrench,
  X,
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
  diet: Utensils,
  "adoption-updates": MessageCircleHeart,
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
  /** The facility plan, and the editor that places enclosures on it. */
  map: MapIcon,
  residents: Users,
  maintenance: Wrench,
  move: PLACEMENT_ICONS.move,
  /** A resident on something other than the standard diet (0087). */
  specialDiet: SECTION_ICONS.diet,
  /** A resident on a current prescription (the facility map's marker). */
  medication: Pill,
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


/**
 * One icon per sidebar link (src/app/NavLinks.tsx). Pages that also have a
 * tile or a heading icon elsewhere reuse that icon, so the menu and the
 * landing pages agree: Enclosures and Maintenance match the enclosure hub,
 * Vets and Contacts the Management tiles, Security the Settings tile,
 * and Projects the folder grid. Management and
 * Settings have no tile of their own, so they take icons none of their
 * children use.
 */
export const NAV_ICONS = {
  home: House,
  my: ListTodo,
  appointments: VET_ICONS.upcoming,
  residents: CONTACT_ICONS.residents,
  enclosures: ENCLOSURE_ICONS.enclosure,
  maintenance: ENCLOSURE_ICONS.maintenance,
  stocktake: ClipboardCheck,
  deliveries: Truck,
  recurringJobs: Repeat,
  vets: VET_ICONS.vet,
  contacts: CONTACT_ICONS.contact,
  projects: Folder,
  shelterOperations: ClipboardList,
  management: BriefcaseBusiness,
  settings: Settings,
  manual: BookOpen,
  releaseNotes: Newspaper,
  changePassword: KeyRound,
  security: ShieldCheck,
} satisfies Record<string, LucideIcon>;

/**
 * One icon per generic action meaning, wherever it appears on any page
 * (src/components/RowAction.tsx, ActionLink). Extend this map rather than
 * picking an icon per page, so a pencil always means Edit and a bin always
 * means Delete. Domain actions (log a weight, book a visit, send to hospital)
 * reuse SECTION_ICONS / PLACEMENT_ICONS instead of appearing here.
 */
export const ACTION_ICONS = {
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  archive: Archive,
  restore: ArchiveRestore,
  /** Stop a running course (prescription, diet) as of today. */
  endToday: CalendarX2,
  back: ArrowLeft,
  /** Clear a search or filter. */
  clear: X,
  /** Count what is on hand (stock). Same icon as the Stocktake nav entry. */
  count: ClipboardCheck,
  /** Fold one record into another (medications). */
  merge: Merge,
  /** Add or replace a photo on a record. */
  uploadImage: ImageUp,
  /** Take a photo off a record (the record stays). */
  removeImage: ImageOff,
  moveUp: ArrowUp,
  moveDown: ArrowDown,
  /** Make this the default / standard one. */
  makeStandard: Star,
  /** Mark a person as no longer active (a doctor who has left), and back. */
  deactivate: UserMinus,
  activate: UserCheck,
  /** Put a recurring thing on hold, and start it again. */
  pause: Pause,
  resume: Play,
  /** Put a profile on the public website, and take it off. */
  publish: Globe,
  unpublish: GlobeLock,
  /** Give a job back to the person it was lifted from. */
  handBack: Undo2,
  /** Reverse a change in the audit log. */
  undo: Undo2,
  /** Move left / right, for a row of photos rather than a list. */
  moveLeft: ArrowLeft,
  moveRight: ArrowRight,
  /** Run a check or job again right now. */
  refresh: RefreshCw,
  /** Send a test message. */
  send: Send,
  /** Let a request in, or turn it away. */
  approve: Check,
  deny: Ban,
  /** Tie two records together, and cut them apart. */
  link: Link2,
  unlink: Unlink,
  /** Sign-in security: a temporary password; two-step reset, and opening its setup. */
  issuePassword: KeyRound,
  resetTwoStep: ShieldOff,
  allowTwoStep: ShieldCheck,
  /** Copy an address or text to the clipboard. */
  copy: Copy,
  /** Go to the screen where a list is managed (the Management or Admin editor for it). */
  manage: Settings,
  /** Save a form (Save changes, Record, Book): the primary submit button. */
  save: Save,
  /** Apply a search or filter form. */
  filter: Funnel,
} satisfies Record<string, LucideIcon>;
