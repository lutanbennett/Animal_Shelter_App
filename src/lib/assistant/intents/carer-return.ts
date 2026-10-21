/**
 * "Panda came back from foster" / "Panda is back from Khun Noi".
 *
 * The other half of rehome: the same helper as the resident's "Return to
 * shelter" page (returnResidentToShelter), which ends whoever has them now.
 * So the carer is never an input to the write. It is matched only against
 * the existing carers (the list the foster / adopt form offers, from
 * loadCarerOptions) so the card can show who was named; a name that
 * matches nobody is kept as said, so the card can say "no carer called X"
 * rather than create one.
 *
 * The return needs an enclosure, which a sentence rarely gives. Null means
 * the person picks it on the card; the helper refuses a Lifecycle bucket.
 */

import { matchByName, matchEnclosure, matchResident, parseDate } from "../text";
import type { IntentParser } from "../types";

const BACK_RE = /(?<![a-z])(back|return|returns|returned|returning)(?![a-z])|กลับ/i;
const CARER_WORD_RE =
  /(?<![a-z])(foster|fostered|fostering|fosterer|adopt|adopted|adopter|adoption|carer)(?![a-z])|ฝากเลี้ยง|รับเลี้ยง|อุปการะ/i;
/** "back from Khun Noi": the words after "from", up to a date word or the end. */
const FROM_NAME_RE =
  /(?<![a-z])from\s+(.+?)(?=\s+(?:today|yesterday|on|to|into|in|this|last)(?![a-z])|[.,!?]|$)/i;
/** "foster with", "the adopter", ... said before the name, or instead of one. */
const CARER_PREFIX_RE =
  /^(?:(?:the|her|his|their)\s+)?(?:fostering|foster|adoption|adopter|carer)(?:\s+(?:home|care|family))?(?:\s+(?:with|at))?\s*/i;
/** A person said by title: "Khun Somchai", "Mrs Lee", "คุณสมชาย". */
const TITLE_RE = /(?<![a-z])(khun|mr|mrs|ms|miss|p'|auntie|uncle)(?![a-z])|คุณ|พี่|ป้า|ลุง/i;

export const carerReturnIntent: IntentParser = {
  intent: "carer-return",
  parse(text, ctx) {
    if (!BACK_RE.test(text)) return null;

    const carer = matchByName(text, ctx.carers, (c) => [c.name]);
    // A return from hospital is the hospital parser's: this one needs foster,
    // adopt, a known carer's name or a person's title to be about a carer.
    if (!CARER_WORD_RE.test(text) && !TITLE_RE.test(text) && !carer.id && carer.candidates.length === 0) {
      return null;
    }

    // Take the carer's name out before looking for the resident, as rehome does.
    let rest = text;
    let carerName: string | null = null;
    if (carer.id) {
      const name = ctx.carers.find((c) => c.id === carer.id)?.name.trim().toLowerCase();
      if (name) rest = rest.split(name).join(" ");
    } else {
      const said = FROM_NAME_RE.exec(text)?.[1]?.replace(CARER_PREFIX_RE, "").trim() ?? "";
      if (said && !/^(hospital|vet|clinic)$/.test(said)) {
        carerName = said;
        rest = rest.split(said).join(" ");
      }
    }
    const resident = matchResident(rest, ctx.residents);

    return {
      draft: {
        kind: "carer-return",
        residentId: resident.id,
        carerId: carer.id,
        carerName,
        enclosureId: matchEnclosure(rest, ctx).id,
        date: parseDate(text, ctx.now),
      },
      residentCandidates: resident.candidates,
    };
  },
};
