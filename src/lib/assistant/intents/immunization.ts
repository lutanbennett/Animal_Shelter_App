/**
 * "Panda had rabies today" / "vaccinate Panda for rabies" / "ฉีดวัคซีนพิษสุนัขบ้าให้ Panda".
 *
 * Claims a sentence only when it names a vaccine the shelter actually
 * records (the same list /immunizations/new offers) or says "vaccine /
 * vaccinated / jab / shot" outright. A type the text names is ticked; a
 * sentence that only says "vaccinated" leaves the types empty for the
 * card. Several types in one sentence are all ticked, as the form allows.
 */

import { matchResident, parseDate } from "../text";
import { mentions } from "../text";
import type { IntentParser } from "../types";

const VACCINE_RE =
  /(?<![a-z])(vaccine|vaccines|vaccinate|vaccinated|vaccination|immunis(e|ed|ation)|immuniz(e|ed|ation)|jab|jabbed|shot)(?![a-z])|วัคซีน|ฉีดยา/i;
const GIVEN_RE =
  /(?<![a-z])(had|got|gets|received|given|gave|needs)(?![a-z])|ฉีด|ได้รับ/i;

export const immunizationIntent: IntentParser = {
  intent: "immunization",
  parse(text, ctx) {
    const typeIds = ctx.immunizationTypes
      .filter((ty) => mentions(text, ty.name) || mentions(text, ty.nameTh))
      .map((ty) => ty.id);

    const saysVaccine = VACCINE_RE.test(text);
    if (!saysVaccine && !(typeIds.length > 0 && GIVEN_RE.test(text))) return null;

    // Take the vaccine names out so a type can't be mistaken for a resident.
    let rest = text;
    for (const ty of ctx.immunizationTypes) {
      if (!typeIds.includes(ty.id)) continue;
      for (const n of [ty.name, ty.nameTh]) {
        const name = (n ?? "").trim().toLowerCase();
        if (name) rest = rest.split(name).join(" ");
      }
    }
    const resident = matchResident(rest, ctx.residents);

    return {
      draft: {
        kind: "immunization",
        residentId: resident.id,
        immunizationTypeIds: typeIds,
        date: parseDate(text, ctx.now),
      },
      residentCandidates: resident.candidates,
    };
  },
};
