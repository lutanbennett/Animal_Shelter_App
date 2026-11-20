/**
 * The shelter enquiry (#shsup): what a stranger may send, checked to the same limits as
 * public.shelter_enquiries (0427). Pure, so the rules are testable without a database.
 */
export type EnquiryFields = {
  shelterName: string;
  contactName: string;
  email: string;
  phone: string;
  location: string;
  message: string;
};

/** The field a visitor must fix. Says nothing about shelters or accounts. */
export type EnquiryProblem = "shelterName" | "contactName" | "email" | "phone" | "location" | "message";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Hard ceiling on any raw field before trimming, so an enormous body never reaches the checks. */
export const RAW_CAP = 8000;

export function cleanEnquiry(
  raw: Record<keyof EnquiryFields, unknown>,
): { ok: true; row: EnquiryFields } | { ok: false; problem: EnquiryProblem } {
  const get = (k: keyof EnquiryFields) => (typeof raw[k] === "string" ? (raw[k] as string).slice(0, RAW_CAP).trim() : "");
  const row: EnquiryFields = {
    shelterName: get("shelterName"),
    contactName: get("contactName"),
    email: get("email"),
    phone: get("phone"),
    location: get("location"),
    message: get("message"),
  };
  if (row.shelterName.length < 1 || row.shelterName.length > 200) return { ok: false, problem: "shelterName" };
  if (row.contactName.length < 1 || row.contactName.length > 200) return { ok: false, problem: "contactName" };
  if (row.email.length > 320 || !EMAIL.test(row.email)) return { ok: false, problem: "email" };
  if (row.phone.length > 60) return { ok: false, problem: "phone" };
  if (row.location.length > 200) return { ok: false, problem: "location" };
  if (row.message.length > 4000) return { ok: false, problem: "message" };
  return { ok: true, row };
}

/** Per-address throttle: at most `max` tries per `windowMs`. In memory: the Pi runs one server, and a restart only forgives. */
export function makeThrottle(max: number, windowMs: number, now: () => number = Date.now) {
  const seen = new Map<string, number[]>();
  return (key: string): boolean => {
    const t = now();
    const recent = (seen.get(key) ?? []).filter((x) => t - x < windowMs);
    if (recent.length >= max) {
      seen.set(key, recent);
      return false;
    }
    recent.push(t);
    seen.set(key, recent);
    if (seen.size > 5000) for (const [k, v] of seen) if (!v.some((x) => t - x < windowMs)) seen.delete(k);
    return true;
  };
}

/** What the visitor is told for every outcome other than their own field being wrong. */
export const ENQUIRY_THANKS = { ok: true } as const;

/**
 * The answer for an insert outcome. Success, a duplicate (23505), a drifted check (23514) and any other failure
 * all return the SAME value, so a stranger cannot tell whether an address is already known. The two logged
 * cases are returned alongside so the caller can log them; the visitor never sees them.
 */
export function answerForInsert(code: string | null | undefined): { answer: typeof ENQUIRY_THANKS; log: "none" | "drift" | "failure" } {
  if (!code || code === "23505") return { answer: ENQUIRY_THANKS, log: "none" };
  return { answer: ENQUIRY_THANKS, log: code === "23514" ? "drift" : "failure" };
}
