# The manual's topics follow the cards, in both directions

Backlog items `#o9fwn` (topics tagged `everyone` that are not everyone's) and `#cjv7v` (cards with no topic).
Lutan, 2026-11-09, reading the filtered manual from Test as a login with three cards (`add_photos`, `meme_library`,
`reel_add`): the filter was correct; the **tags** and the **missing topics** were wrong. Everything below is stated per
card or per activity, never per role.

## The test applied to each of the 17 topics tagged `everyone`

*Would this topic still make sense to a login holding no cards at all, and with no menu?*

| topic | decision | why |
| --- | --- | --- |
| `sign-in` | stays `everyone` | Teaches signing in. One step said Change password is "at the bottom of the menu"; reworded to say that is so for a login that has a menu. |
| `confirm-and-offline` | stays `everyone` | The delete box and the offline bar are on every screen. |
| `language` | stays `everyone` | The EN / ไทย switch is in every header. |
| `entering-dates` | stays `everyone` | Every date box. |
| `colours` | stays `everyone` | The account menu at the top right. |
| `home-screen-icons` | stays `everyone` | Lists "one picture for each page you can open", so it adapts itself to the cards held. |
| `print-manual` | stays `everyone` | Every signed-in login may read and print the manual. |
| `navigation` | stays `everyone`, **rewritten** | Described a left-hand menu at length. It now starts from the home screen's tiles and says a menu is something a login may or may not have. The role names ("a doctor's menu is just Appointments and Residents", "for admins — Security") are gone. |
| `shelter-operations` | **`unassigned`** | The Operations front page opens for any one of a dozen cards, so no single card owns it. It is left as a visible gap, not hidden. |
| `release-notes` | stays `everyone`, reworded | The page is open to every signed-in login. "Bottom of the menu" is now "in the menu it is at the bottom"; the "Nothing for Doctor" example is gone. A login with no menu still cannot reach it: that is `tiles-only-links`' fix (tiles), not this PR's. |
| `roles` | stays `everyone` | Explains what a card is; the one topic about the card system itself. |
| `home-covering-another-role` | **`unassigned`** | Holding a second set of cards for a while is not something any card grants. Left as a visible gap for a decision. |
| `residents-list` | **split**; full version `resident.record` (read) | 14 steps teaching the microchip filter, ticking residents and a spreadsheet whose columns include the microchip and prescriptions. |
| `hub` | **split**; full version `resident.record` (read) | 8 steps on the pencil, Move enclosure, Send to hospital, Foster / adopt and the medical cards. |
| `name-card` | `cards: ["enclosures"]` | Same family as the reduced hub: you land on a resident's page. |
| `public-pages` | `website.content` (read) | Lutan: "it needs the approval step first". It is for whoever works on the website. |
| `getting-help` | stays `everyone` | Who to tell when the manual is wrong. |

## The two splits, and the one thing the brief did not foresee

`residents-list-who-and-where` and `hub-who-and-where` are new, short topics for the reduced experience. The brief
tied them to `resident.who_and_where` (read). **Measured, that reaches thirteen cards**, because `who_and_where` is a
supporting grant on `add_photos`, `meme_library`, `meme_add`, `reel_library`, `reel_add`, `dashboard`,
`donations_receipts`, `assistant`, `enclosures` and the job cards. A login holding only the three photo, reel and meme
cards would have been shown *Finding a resident*, which is exactly what Lutan said was not their job.

So the reduced topics (and `name-card`) are tied to **`enclosures`**: the one card whose purpose is knowing who is where.
`holdsCard` is "covers every cell of the card", so a holder of any wider card (View residents) is still shown them. Open
question for Lutan: if some other card should also see the reduced resident topics, name it and add it to those three
topics' `cards:` lists. The cost of getting it wrong is a topic missing for a login that has the page, not a security
fault.

## Part 2: 15 cards with no topic

The check `scripts/check-cards-have-topics.mjs` (in `npm run lint`) lists them and now passes with none outstanding.

| card | covered by |
| --- | --- |
| `reel_add`, `reel_library` | new `reels-add` (`social.reels`) |
| `reel_view` | `reels-add` is now **read** level: the browse-only card sees the same screen without the buttons. |
| `meme_view` | the existing `memes` topic, now read level, for the same reason. |
| `food_forecast`, `medicine_forecast` | `manage-diets` / `manage-medications`, now read level, each with an introduction saying the card reads and changes nothing. |
| `view_cashflow`, `view_expenses` | `cashflow`, `expenses`, now read level. |
| `diet_settings` | new `diet-settings` |
| `approve_text` | new `approve-text` |
| `website_photos` | new `website-gallery` |
| `propose_website` | new `website-propose` |
| `propose_translations`, `view_translations` | new `translations-propose`, `translations-view` (the latter `cards: ["view_translations"]`) |
| `bill_sites` | new `bill-sites` |

No card is recorded in `docs/cards-without-topic.json` as needing none. That file exists so the next card that
legitimately needs none can say why, with a date; a record for a card that has gained a topic fails the check.

## Why browse-only cards are covered by raising the level instead of writing a second topic

A first draft wrote separate *Reels: browsing* and *Memes: browsing* topics. `holdsCard` treats a wider card as holding
a narrower one, so the browse-only topic was also shown to every editor, and the three-card login got two near-duplicate
topics. A read-level edit topic reaches the same people with one topic.

## Also changed

- `adding a photo` (`add-photos-unknown`) is reframed: *I know who it is* and *I don't know* are both first-class steps,
  and nothing mentions reaching a resident through the Hub (that needs `photos.resident_add`). The card is not widened.
  Its two mentions of "Management" are now "whoever approves photos".
- `scripts/acceptance-matrix.mjs` referenced an undefined `CARDS` for a topic that names cards explicitly. No topic had
  hit that branch before. It now reads the card's bundle through `bundleOfCards`.
- `for-topic.test.mjs` no longer requires an unassigned topic to carry a role worklist (`awaitingCard`), which would
  have meant writing role names into the two topics above.

## Not done

- The Operations and covering-another-role topics are left `unassigned` (shown to everyone, marked).
- Release notes and Change password are unreachable from a login with no menu: `tiles-only-links`.
- `src/app/manual/page.tsx`, the PDF route and the releases page belong to `manual-view-all-gate`.
