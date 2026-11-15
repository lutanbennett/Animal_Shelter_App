# Public microchip register — scope and recommendation

Status: **paper written 2026-11-15 on `claude/microchip-register-paper`; awaiting Lutan's answers (the five at the end). Item `#dqgy8`.**
No schema and no public form until it is agreed, and **this paper does not recommend starting either.**

## Recommendation

**Do not build a register of our own. If the shelter wants anything here, build only the cheap half: make sure every
chip the shelter implants or records is listed with a register that already exists, and tell the adopter which one.**

Why, from what was found (section 0):

1. **The pool is tiny.** Animals do not leave this shelter chipped, and only international adoption needs a chip
   (`en.ts:746`). A register of "people who chipped their own pet" in a country where chipping was not routine is a
   register with very few entries, so a scanning shelter would nearly always get no hit.
2. **The ground is moving under it.** Bangkok now requires dogs and cats to be registered and chipped, with a city
   database (sources below). A national bill was also pulled back for review. Whichever register becomes the one
   owners use, it will be a government one. A private shelter register built now is the likeliest thing to be
   duplicated.
3. **The risk is out of proportion.** A public page that collects owners' names and contact details is a PDPA data
   controller duty with fines (section 2), a dispute process nobody at the shelter is equipped to run (section 4) and a
   spam target (section 6) — for almost no reunions.

What would change this answer: a national or provincial register turning out to exist and to *accept entries from
non-owners' shelters*, or the shelter finding it is regularly scanning found animals whose owners are unreachable.
Neither is evidenced today.

## 0. Facts established (searched 2026-11-15, English and Thai, web search only)

Four rounds, stopped there as the brief says. **I could not open the primary Thai sources (dld.go.th, the Bangkok
portal); everything below is from news and law-firm summaries and needs confirming with the authority before relying on it.**

**0a. Does Thailand keep a register?**

- **No single national pet-microchip register was found.** Searched: Department of Livestock Development
  microchip/register terms in English, and the same in Thai (ทะเบียนไมโครชิพ สุนัข แมว กรมปศุสัตว์). Neither turned up a
  national database or a way to look a chip up outside Bangkok. **Not established either way** for the DLD itself.
- **Bangkok has one, or is building one.** A Bangkok ordinance requires owners to register and chip dogs and cats
  (within 120 days of birth, or 30 days of bringing one into the city), using an online portal and the owner's national
  ID; reports say effective January 2026, one source says postponed or 2027 — **the current date is not established.**
  Booking was added to the city's Traffy Fondue app from April 2026. One report has DLD confirming district-office and
  clinic registration; a single source, unverified.
- **A national dog-and-cat registration bill** was Cabinet-approved, then taken back by the DLD after public anger over the
  registration fee. **Current status not established.**
- **Nothing found for Chiang Mai or any other province.** Not established.
- Import rules (DLD permit, ISO 11784/11785 15-digit chip) concern animals entering Thailand, not a register of those in it.

**0b. Which international lookup services list Thai-issued chips?**

- **Not established.** The AAHA Universal Pet Microchip Lookup is built mainly for US chips and holds no data of its own:
  it asks participating registries which one holds a number. Europetnet is a similar aggregator. No source said whether Thai
  chips or a Thai register appear in either. The practical test is cheap and is a job for a person: look up one of our own
  recorded 15-digit numbers on the AAHA and Europetnet pages and see what comes back.
- The 15-digit ISO format the app already validates (`en.ts` "exactly 15 digits") is the one these tools expect, so Thai-issued
  ISO chips are findable *if* the manufacturer's or a partner registry holds them. Whether anyone registered them there is the
  real question, and the app cannot answer it.

Sources: [Nation Thailand — Bangkok mandates registration and microchip](https://www.nationthailand.com/thailand/bangkok/40061641);
[Nation — registration bill to be rethought](https://www.nationthailand.com/news/30356285);
[Thaiger — Bangkok's new law](https://thethaiger.com/news/bangkok/bangkoks-new-law-register-and-microchip-pets-by-january-2026);
[Khaosod English](https://www.khaosodenglish.com/life/animal/2025/08/23/free-pet-microchips-offered-in-bangkok-registration-drive/);
[Thailand Now — Bangkok postpones](https://www.thailandnow.in.th/?p=18151);
[Thai Publica — Traffy Fondue booking](https://thaipublica.org/2026/04/bangkok-traffy-fondue-pr-01042026/);
[AAHA lookup](https://www.aaha.org/petmicrochiplookup).

**What this means for demand.** The "chipping is not routine" premise holds for this shelter and, as far as the evidence goes,
outside Bangkok; Bangkok is the exception and is being handled by the city. The premise is an assumption the paper tested
only partly.

## 1. Who runs and is accountable for the data — `waits on tenancy (#ykefa)`

Under PDPA the accountable party is the **data controller**, the body that decides why and how the data is used. Options:
the shelter, a foundation, or the app's owner. For **one shelter** the answer is simply the shelter. For **many** shelters
sharing one register it is a different question (a joint controller, or a separate body that every shelter contracts with),
and that is the tenancy question, held until Lanna is live. **Recommendation: no answer now; it is one more reason not to start.**
(Governance structure is a legal question; I have not sourced a Thai-law answer and have not invented one.)

## 2. PDPA consent and retention — `settle now` (facts), the legal reading needs a Thai lawyer

From the law-firm summaries found (not the Act itself): consent must say purpose, data collected, who it goes to and
**how long it is kept**; withdrawal must be possible and publicised; data may not be kept indefinitely once its purpose is
done; penalties run to criminal fines up to THB 1,000,000 and administrative fines up to THB 5,000,000, and civil
claims including class actions are allowed. **Source: [Tilleke & Gibbins](https://www.tilleke.com/insights/thailand-operationalising-pdpa-lawful-basis-sensitive-personal-data-and-data-processing-safeguards/19/),
[Legal 500](https://www.legal500.com/developments/thought-leadership/thailands-personal-data-protection-overview-and-updates).**
This repository has **no PDPA policy** (`grep -rln PDPA docs/` finds four files, none a policy), so a public register would be
the first place the shelter holds strangers' data under it. **Recommendation:** treat that gap as a reason to wait, not a
box to tick during a build. Retention would have to be a stated period with deletion, which means building that too.

## 3. How an owner proves the animal is theirs — `settle now`

A public form cannot prove ownership: anyone can type a chip number and a name. The honest options are (a) accept the claim
unverified and say so, (b) verify through the implanting vet or the chip's paperwork, which needs a person to check each
one. **Recommendation:** unverified claims in a register that a shelter then relies on to "return" an animal are dangerous;
if anything is ever built, entries should come only from a vet or the shelter itself, not from the public.

## 4. Disputed or transferred chips — `settle now`

Two people claiming one chip, or an owner who has given the animal away, needs an owner of the process who can say no, freeze
an entry and hear both sides. The shelter has no such role and the item says nothing about creating one. **Recommendation:**
do not take on adjudication. Point disputes to the implanting vet or the authority that holds the official register.

## 5. What a scanning shelter is shown — `settle now`

**A constraint, not an option (the item's own words): a way to contact the owner through the system, not their phone number
or address.** So the shelter sees "registered, owner can be reached", plus a relay (a message sent on the shelter's behalf).
That relay is itself a feature: it needs delivery, a record, and someone responsible when it is ignored. It also means the
register only works if owners keep their contact route working, which is a retention problem (section 2).

## 6. Abuse and spam on a public form — `settle now`

A public form that writes to a database of identities needs rate limiting, a bot check, validation of the 15-digit number,
and a way to stop one person claiming many chips or probing which numbers exist (a lookup is itself a leak). All are known
and buildable, and all are ongoing work. **Recommendation:** another cost that is not worth paying for a small pool.

## 7. Join an existing register rather than make another — `settle now` for the principle

**Yes, if anything.** What to join is not established (section 0): Bangkok's registry applies to Bangkok residents; a national
one is not confirmed; international aggregators list only what a participating registry holds. **The cheap, durable move
is outside the app:** when the shelter implants or records a chip for an international adoption, the adopter (and the vet who
implants) registers it with a registry the destination country uses. That needs a sentence in the adopter's paperwork, not a build.

## Open questions at a glance

| # | Question | When |
|---|---|---|
| 0 | Does DLD or a province keep a register; do Thai chips appear in the international lookups | `settle now` (a person checks with DLD; look up one real chip) |
| 1 | Who is accountable for the data | `waits on tenancy (#ykefa)` |
| 2 | PDPA basis, consent text, retention | `settle now` (needs a Thai lawyer; not settled by this paper) |
| 3–6 | Ownership proof, disputes, scanner view, abuse | `settle now`, and all point to "do not build" |
| 7 | Join, not build | `settle now` |

## The decisions that are Lutan's (at most five — the planner will put them to him)

1. **Do we build a public register at all?** Recommendation: **no**; close `#dqgy8` as "decided not to, 2026-11-xx" and keep only the paperwork line in 2.
2. **Does the shelter add a line to adoption paperwork saying which register to list an exported chip with?** Recommendation: yes, it costs nothing.
3. **Do we have someone phone or write to the Department of Livestock Development to ask whether a national register exists or is coming?** Recommendation: yes, one enquiry, then revisit only if the answer is "yes".
4. **Do we look up one of our own recorded chip numbers on the AAHA and Europetnet pages, to learn whether Thai chips are findable?** Recommendation: yes, it takes a few minutes and settles 0b.
5. **If he does want a register later, does it wait for the multi-shelter work (`#ykefa`)?** Recommendation: yes, because who is accountable depends on it.
