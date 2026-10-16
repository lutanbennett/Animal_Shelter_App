/**
 * "Bella died last night, lung problems" — the first destructive intent.
 *
 * A death takes the resident off the list of animals the shelter looks
 * after, so this parser is deliberately stingy:
 *
 *   - the date is only filled when the sentence gives one a calendar can
 *     hold (today, yesterday, a weekday, an ISO date). "Last night" and
 *     "overnight" straddle midnight and stay blank for the person to pick;
 *   - the resident is matched against the part of the sentence *before*
 *     the cause, so "Bella died, bitten by Rex" cannot also claim Rex;
 *   - no match, or several, leaves residentId null and the card asks.
 */

import { matchResident, parseDate } from "../text";
import type { IntentParser } from "../types";

const DEATH_RE =
  /(?<![a-z])(died|dies|dead|death|deceased|passed away|passed on|has passed|pass away)(?![a-z])|ตาย|เสียชีวิต|จากไป/i;

/** "last night", "overnight", "tonight": no single calendar day. */
const STRADDLES_RE =
  /(?<![a-z])(last night|overnight|tonight|during the night|in the night)(?![a-z])|เมื่อคืน|คืนที่แล้ว|ค่ำคืน/i;

/** Where the cause starts: a comma, or "of / from / due to / because of". */
const CAUSE_SPLIT_RE =
  /\s*,\s*|\s+(?:of|from|due to|because of|after)\s+|\s*(?:เพราะ|จาก|ด้วยโรค)\s*/i;

const LEADING_FILLER_RE = /^(?:the\s+)?(?:cause\s+was\s+|it\s+was\s+|was\s+|a\s+)?/i;

export const deathIntent: IntentParser = {
  intent: "death",
  parse(text, ctx) {
    if (!DEATH_RE.test(text)) return null;

    // Everything from the first cause marker after the death word on is
    // the cause, not a second place to look for names.
    const deathAt = text.search(DEATH_RE);
    const after = text.slice(deathAt);
    const marker = after.match(CAUSE_SPLIT_RE);
    const hasCause = marker?.index !== undefined;
    const head = hasCause ? text.slice(0, deathAt) + after.slice(0, marker.index) : text;
    const causeRaw = hasCause ? after.slice(marker.index! + marker[0].length) : "";

    const resident = matchResident(head, ctx.residents);

    // A date inside the cause ("after the operation on friday") is not
    // the date of death, so only the head is read.
    const date = STRADDLES_RE.test(head) ? null : parseDate(head, ctx.now);

    // The cause stays as typed; the person can fix it on the card.
    const cause = causeRaw.replace(LEADING_FILLER_RE, "").replace(/[.!\s]+$/, "").trim();

    return {
      draft: {
        kind: "death",
        residentId: resident.id,
        date,
        causeOfDeath: cause ? cause.slice(0, 200) : null,
      },
      residentCandidates: resident.candidates,
    };
  },
};
