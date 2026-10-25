---
card: assistant
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (1 card, 2 permissions: ask the assistant and record through it, both at edit); the same page was also opened as a login without this card
---

## Purpose

Lets a person ask the shelter's assistant plain-English questions ("Where is Panda?", "Who is in A3?", "What is due this week?") and have it fill in simple records ("Panda weighs
12.4 kg", "Send Panda to hospital today") for the person to confirm before anything is written. The page says it understands a fixed list of requests.

## Gives access to

### Pages

- **Assistant** (the card's own page): a box to type into and a list of example requests. The same box is reachable from the **Assistant** button in the header.
- **Residents** is offered in the menu. It was not opened this pass; the earlier row in the fault log records "0 residents" for a card like this.

### Tables

- **None directly.** The assistant reads and writes through the same permissions the person holds, so a login with only this card can read and write almost nothing.

### Forms

- **Where is (a resident)?**: does not work. "Where is Kame?" (a real resident) and "Where is R-0036?" (the same resident, by code) both answered "Which resident do you mean? Use the name
  as it is written on their record, or their code."
- **Who is in (an enclosure)?**: does not work. "Who is in Cat Enclosure?" asked for the enclosure's name "as it is written on the enclosures list", although Cat Enclosure is written exactly
  that way.
- **What is due this week?**: answers, and the answer is wrong. It said "Due in the next 7 days: Nothing is due, and nothing is overdue." On the same database 7 maintenance jobs are past
  their due date and not finished, and 6 clinic visits are still marked scheduled with dates already gone (counted with the service key, not by this login). The card cannot read either list, so it
  read both as empty and reported the empty result as the truth. There is no warning.
- **Record a weight, or move a resident**: the sentence is understood and a confirm form appears ("Log weight: Record … at 12.4 kg", "Move resident: Move … from … to …"), but the
  form's "Resident" box is empty (it offers only "Choose a resident"), and for the move the zone and enclosure boxes are empty too. So the form can be shown but never completed, and
  nothing was written (the page was left without pressing Confirm). The other requests (send to hospital, record a death, book a visit) were not tried; each starts the same way, with a resident to choose.

## Major restrictions

- **It tells a person it has looked and found nothing, when it could not look.** That is worse than a refusal. "Nothing is due, and nothing is overdue" is the one answer this card can give, and it
  is false. A person who relies on it would miss an overdue job or an appointment.
- **Cannot name a resident or an enclosure**, so the card does none of the things it advertises on its own page. (Same finding as the earlier row: no card grants the resident look-up that
  the assistant needs.)
- **Holds a permission that does nothing.** Record through the assistant gives nothing to a login that cannot name a resident: the form appears and cannot be finished. That is the "a card
  must never do nothing" rule failing, in a small way. (The earlier row said no request could reach the confirm step; driving shows the form does appear, so that row is contradicted in
  part, and the fault it points at stands.)
- **It is not a door to anything else. This was the question, and the answer is no.** A login holding only this card cannot get the assistant to name a resident, list an enclosure, summarise
  a medical note or show a job. It does not reach data the person cannot open. The failure is the other way round: it is blind, and it does not say so.
- **The page opens for any signed-in person**, and says "Your account can't use the assistant." to a login without the card (driven as a login holding only the Meme library card).
  Nothing was answered to that login.

## Recommendation

- **Fix (needed):** make the "due" answer say "I can't see jobs or visits with this login" instead of "nothing is due". An empty answer from a card that cannot read the data must not look the
  same as an empty answer from one that can.
- **Increase (needed, small):** give the card the resident look-up (and the enclosure list) it needs to name an animal, as the earlier rows already suggest; otherwise the card does not do
  what its tile says.
- **Decrease:** if the assistant is to stay narrow, drop the record permission from this card, because it can do nothing with it on its own.
