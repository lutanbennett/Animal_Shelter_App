/**
 * What the public sign-up form and the staff drive form send, and the one
 * check each of the form and the server action runs. Pure and client-safe.
 * The database (0233) has the final say; these catch the plain mistakes first.
 */

export const DRIVE_SPECIES = ["dog", "cat"] as const;
export type DriveSpecies = (typeof DRIVE_SPECIES)[number];
export const PET_SEXES = ["male", "female", "unknown"] as const;
export type PetSex = (typeof PET_SEXES)[number];
export const DRIVE_STATUSES = ["draft", "open", "cancelled"] as const;
export type DriveStatus = (typeof DRIVE_STATUSES)[number];
export const SIGNUP_STATUSES = ["new", "confirmed", "cancelled", "attended", "no_show"] as const;
export type SignupStatus = (typeof SIGNUP_STATUSES)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}(:\d{2})?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blankToNull = (v: string) => {
  const s = v.trim();
  return s ? s : null;
};

// ---------------------------------------------------------------- sign-up

export type SignupFields = {
  driveId: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  petName: string;
  petSpecies: string;
  petSex: string;
  petAgeNote: string;
  notes: string;
};
export type SignupProblem = "drive" | "ownerName" | "contact" | "email" | "petName" | "species" | "sex" | "tooLong";

export type CleanSignup = {
  drive_id: string;
  owner_name: string;
  owner_phone: string | null;
  owner_email: string | null;
  pet_name: string;
  pet_species: DriveSpecies;
  pet_sex: PetSex;
  pet_age_note: string | null;
  notes: string | null;
};

export function checkSignup(f: SignupFields): { ok: true; signup: CleanSignup } | { ok: false; problem: SignupProblem } {
  if (!UUID.test(f.driveId.trim())) return { ok: false, problem: "drive" };
  const ownerName = f.ownerName.trim().replace(/\s+/g, " ");
  if (!ownerName) return { ok: false, problem: "ownerName" };
  const phone = blankToNull(f.ownerPhone);
  const email = blankToNull(f.ownerEmail);
  if (!phone && !email) return { ok: false, problem: "contact" };
  if (email && !EMAIL.test(email)) return { ok: false, problem: "email" };
  const petName = f.petName.trim().replace(/\s+/g, " ");
  if (!petName) return { ok: false, problem: "petName" };
  if (!DRIVE_SPECIES.includes(f.petSpecies as DriveSpecies)) return { ok: false, problem: "species" };
  if (!PET_SEXES.includes(f.petSex as PetSex)) return { ok: false, problem: "sex" };
  const age = blankToNull(f.petAgeNote);
  const notes = blankToNull(f.notes);
  if (
    ownerName.length > 120 ||
    petName.length > 80 ||
    (phone?.length ?? 0) > 40 ||
    (email?.length ?? 0) > 200 ||
    (age?.length ?? 0) > 80 ||
    (notes?.length ?? 0) > 1000
  ) {
    return { ok: false, problem: "tooLong" };
  }
  return {
    ok: true,
    signup: {
      drive_id: f.driveId.trim(),
      owner_name: ownerName,
      owner_phone: phone,
      owner_email: email,
      pet_name: petName,
      pet_species: f.petSpecies as DriveSpecies,
      pet_sex: f.petSex as PetSex,
      pet_age_note: age,
      notes,
    },
  };
}

/** The gate's exception messages (0233), mapped to the dictionary key that explains each. */
export function signupRefusalKey(message: string | undefined) {
  const m = message ?? "";
  if (m.includes("desexing_drive_not_open")) return "notOpen" as const;
  if (m.includes("desexing_drive_species_not_taken")) return "speciesNotTaken" as const;
  if (m.includes("desexing_drive_full")) return "full" as const;
  if (m.includes("desexing_signup_too_many_for_contact")) return "tooManyForContact" as const;
  if (m.includes("desexing_signup_rate_limited")) return "rateLimited" as const;
  return null;
}

// ------------------------------------------------------------------ drive

export type DriveFields = {
  title: string;
  driveDate: string;
  startsAt: string;
  endsAt: string;
  venue: string;
  venueAddress: string;
  species: string[];
  capacity: string;
  signupsCloseOn: string;
  priceNote: string;
  eligibilityNote: string;
  description: string;
  status: string;
};
export type DriveProblem =
  | "title"
  | "venue"
  | "date"
  | "time"
  | "timeOrder"
  | "species"
  | "capacity"
  | "closeDate"
  | "status";

export type CleanDrive = {
  title: string;
  drive_date: string;
  starts_at: string | null;
  ends_at: string | null;
  venue: string;
  venue_address: string | null;
  species: DriveSpecies[];
  capacity: number | null;
  signups_close_on: string | null;
  price_note: string | null;
  eligibility_note: string | null;
  description: string | null;
  status: DriveStatus;
};

const validDate = (v: string) => ISO_DATE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

export function checkDrive(f: DriveFields): { ok: true; drive: CleanDrive } | { ok: false; problem: DriveProblem } {
  const title = f.title.trim().replace(/\s+/g, " ");
  if (!title) return { ok: false, problem: "title" };
  const venue = f.venue.trim().replace(/\s+/g, " ");
  if (!venue) return { ok: false, problem: "venue" };
  const date = f.driveDate.trim();
  if (!validDate(date)) return { ok: false, problem: "date" };
  const starts = blankToNull(f.startsAt);
  const ends = blankToNull(f.endsAt);
  if ((starts && !TIME.test(starts)) || (ends && !TIME.test(ends))) return { ok: false, problem: "time" };
  if (starts && ends && ends <= starts) return { ok: false, problem: "timeOrder" };
  const species = DRIVE_SPECIES.filter((s) => f.species.includes(s));
  if (species.length === 0) return { ok: false, problem: "species" };
  const capText = f.capacity.trim();
  let capacity: number | null = null;
  if (capText) {
    capacity = Number(capText);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) return { ok: false, problem: "capacity" };
  }
  const close = blankToNull(f.signupsCloseOn);
  if (close && (!validDate(close) || close > date)) return { ok: false, problem: "closeDate" };
  if (!DRIVE_STATUSES.includes(f.status as DriveStatus)) return { ok: false, problem: "status" };
  return {
    ok: true,
    drive: {
      title,
      drive_date: date,
      starts_at: starts,
      ends_at: ends,
      venue,
      venue_address: blankToNull(f.venueAddress),
      species,
      capacity,
      signups_close_on: close,
      price_note: blankToNull(f.priceNote),
      eligibility_note: blankToNull(f.eligibilityNote),
      description: blankToNull(f.description),
      status: f.status as DriveStatus,
    },
  };
}
