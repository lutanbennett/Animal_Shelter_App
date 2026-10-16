/**
 * "Panda goes to foster with Khun Noi" / "Panda has been adopted by Khun Noi".
 *
 * The carer is matched only against the carers that already exist (the
 * same list the foster / adopt form offers). A name that matches nobody
 * is left blank, never created from a sentence: a new carer needs contact
 * details and a decision a person should make on the form.
 *
 * "Came back from foster" is the return, a different helper with a
 * different question (which enclosure?), and is not claimed here.
 */

import { matchByName, matchResident, parseDate } from "../text";
import type { IntentParser, RehomeDraft } from "../types";

const FOSTER_RE = /(?<![a-z])(foster|fostered|fostering|fosters)(?![a-z])|ฝากเลี้ยง|ฝาก/i;
const ADOPT_RE =
  /(?<![a-z])(adopt|adopted|adopts|adopting)(?![a-z])|รับเลี้ยง|อุปการะ|รับไปเลี้ยง/i;
const BACK_RE = /(?<![a-z])(back|return|returns|returned|returning)(?![a-z])|กลับ/i;

export const rehomeIntent: IntentParser = {
  intent: "rehome",
  parse(text, ctx) {
    const foster = FOSTER_RE.test(text);
    const adopt = ADOPT_RE.test(text);
    if (!foster && !adopt) return null;
    if (BACK_RE.test(text)) return null;

    const carer = matchByName(text, ctx.carers, (c) => [c.name]);

    // Take the carer's name out before looking for the resident, so a
    // carer who shares a name with a resident cannot be mistaken for one.
    let rest = text;
    if (carer.id) {
      const name = ctx.carers.find((c) => c.id === carer.id)?.name.trim().toLowerCase();
      if (name) rest = rest.split(name).join(" ");
    }
    const resident = matchResident(rest, ctx.residents);

    const rehomeKind: RehomeDraft["rehomeKind"] =
      foster && adopt ? null : adopt ? "adopt" : "foster";

    return {
      draft: {
        kind: "rehome",
        residentId: resident.id,
        rehomeKind,
        carerId: carer.id,
        date: parseDate(text, ctx.now),
      },
      residentCandidates: resident.candidates,
    };
  },
};
